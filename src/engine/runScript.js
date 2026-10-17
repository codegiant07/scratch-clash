import { findNewCollisions } from "./collision";
import { clampToStage } from "./stage";

const toNumber = (value) => {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
};

// Scratch keeps direction in the range (-180, 180]; 90 = facing right.
const normalizeDirection = (direction) => {
  const result = ((((direction + 180) % 360) + 360) % 360) - 180;
  return result === -180 ? 180 : result;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Scratch redraws at 30 frames per second and loops wait one frame per pass.
const FRAME_MS = 1000 / 30;
const nextFrame = () => sleep(FRAME_MS);

// Waits in frame-sized slices so Stop takes effect straight away.
async function wait(seconds, isStopped) {
  const end = Date.now() + Math.max(0, seconds) * 1000;
  while (!isStopped() && Date.now() < end) {
    await sleep(Math.min(FRAME_MS, end - Date.now()));
  }
}

// Stop bumps the generation; every running script checks it and exits.
let generation = 0;
// Scripts running now, per sprite: Set of { spriteId, stackId, isStopped }.
// A run's spriteId can change mid-run when a collision hands it to another sprite.
const runningScripts = {};
let nextBubbleId = 1;
let nextEffectId = 1;

const runningOf = (spriteId) =>
  runningScripts[spriteId] || (runningScripts[spriteId] = new Set());

// Stack ids a sprite is animating right now (single palette blocks don't count).
const runningStackIds = (spriteId) =>
  [...runningOf(spriteId)]
    .filter((run) => run.stackId && !run.isStopped())
    .map(({ stackId }) => stackId);

export function stopAll(engine) {
  generation++;
  // Stop also clears every speech/thought bubble, like Scratch
  if (!engine) return;
  engine.getState().sprites.forEach(({ id, bubble }) => {
    if (bubble) {
      engine.dispatch({ type: "UPDATE_SPRITE", id, changes: { bubble: null } });
    }
  });
}

// Runs one block on one sprite. `engine` is { getState, dispatch } from the store.
export async function runBlock(
  block,
  spriteId,
  { getState, dispatch },
  isStopped = () => false
) {
  const sprite = getState().sprites.find(({ id }) => id === spriteId);
  if (!sprite) return;

  const update = (changes) =>
    dispatch({ type: "UPDATE_SPRITE", id: spriteId, changes });
  const { inputs } = block;

  switch (block.type) {
    case "move": {
      const steps = toNumber(inputs.steps);
      const radians = (sprite.direction * Math.PI) / 180;
      update({
        ...clampToStage(
          sprite.x + steps * Math.sin(radians),
          sprite.y + steps * Math.cos(radians)
        ),
        // Walking backwards mirrors the cat so it faces where it's going
        mirrored: steps === 0 ? sprite.mirrored : steps < 0,
      });
      checkCollisions(spriteId, { getState, dispatch });
      break;
    }
    case "turnRight":
      update({
        direction: normalizeDirection(
          sprite.direction + toNumber(inputs.degrees)
        ),
      });
      break;
    case "turnLeft":
      update({
        direction: normalizeDirection(
          sprite.direction - toNumber(inputs.degrees)
        ),
      });
      break;
    case "goTo":
      update(clampToStage(toNumber(inputs.x), toNumber(inputs.y)));
      checkCollisions(spriteId, { getState, dispatch });
      break;
    case "sayFor":
    case "thinkFor": {
      const text = String(inputs.message);
      const kind = block.type === "sayFor" ? "say" : "think";
      // An empty message shows no bubble, like Scratch
      const bubble = text ? { id: nextBubbleId++, kind, text } : null;
      update({ bubble });
      await wait(toNumber(inputs.seconds), isStopped);
      // Only clear our own bubble; another block may have replaced it meanwhile
      const current = getState().sprites.find(({ id }) => id === spriteId);
      if (
        bubble &&
        current &&
        current.bubble &&
        current.bubble.id === bubble.id
      ) {
        update({ bubble: null });
      }
      break;
    }
    default:
      // Event blocks only start scripts; they do nothing when run directly.
      break;
  }
}

// Each block runs on whichever sprite the run drives *now* (see swapAnimations).
async function runBlocks(blocks, run, engine) {
  for (const block of blocks) {
    if (run.isStopped()) return;
    if (block.type === "repeat") {
      const times = Math.round(toNumber(block.inputs.times));
      for (let i = 0; i < times; i++) {
        await runBlocks(block.children, run, engine);
        if (run.isStopped()) return;
        await nextFrame();
      }
    } else {
      await runBlock(block, run.spriteId, engine, run.isStopped);
    }
  }
}

// Runs a list of blocks in order until it ends or Stop is pressed.
// `stackId` marks it as a script animation (single palette blocks have none).
export function runStack(blocks, spriteId, engine, stackId = null) {
  const runGeneration = generation;
  const run = {
    spriteId,
    stackId,
    isStopped: () => generation !== runGeneration,
  };
  runningOf(spriteId).add(run);
  return runBlocks(blocks, run, engine).finally(() =>
    runningOf(run.spriteId).delete(run)
  );
}

// Hero Feature: when two sprites bump, they swap their *running animations*:
// each one carries on the other's animation exactly where it was. Each
// sprite's own script in the editor is left unchanged, so the next Play
// starts fresh (its own "go to", its own "say"). Nothing restarts mid-run.
function swapAnimations(idA, idB, engine) {
  const { getState, dispatch } = engine;
  const find = (spriteId) =>
    getState().sprites.find(({ id }) => id === spriteId);
  const a = find(idA);
  const b = find(idB);
  // Bump counters replay the wobble on the stage
  dispatch({ type: "UPDATE_SPRITE", id: idA, changes: { bumps: a.bumps + 1 } });
  dispatch({ type: "UPDATE_SPRITE", id: idB, changes: { bumps: b.bumps + 1 } });
  // Show a "BUMP!" burst halfway between the two sprites
  dispatch({
    type: "ADD_EFFECT",
    effect: { id: nextEffectId++, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
  });

  const runsA = [...runningOf(idA)];
  const runsB = [...runningOf(idB)];
  runsA.forEach((run) => (run.spriteId = idB));
  runsB.forEach((run) => (run.spriteId = idA));
  runningScripts[idA] = new Set(runsB);
  runningScripts[idB] = new Set(runsA);
}

// Swap only while at least one of the two is animating, so placing
// sprites by hand never swaps anything.
function checkCollisions(spriteId, engine) {
  findNewCollisions(spriteId, engine.getState().sprites).forEach((other) => {
    if (runningStackIds(spriteId).length || runningStackIds(other.id).length) {
      swapAnimations(spriteId, other.id, engine);
    }
  });
}

// Starts every stack whose first block is `hatType`, for the given sprites.
export function startHatScripts(hatType, engine, spriteIds) {
  engine
    .getState()
    .sprites.filter(({ id }) => !spriteIds || spriteIds.includes(id))
    .forEach((sprite) =>
      sprite.stacks
        .filter(({ blocks }) => blocks[0] && blocks[0].type === hatType)
        .forEach(({ id, blocks }) => runStack(blocks, sprite.id, engine, id))
    );
}

// Green flag: restart all flag scripts, like Scratch.
export function playAll(engine) {
  stopAll(engine);
  startHatScripts("whenFlagClicked", engine);
}
