// Pure helpers for a sprite's scripts. Shape:
//   stacks = [{ id, x, y, blocks: [block, ...] }]
//   block  = { id, type, inputs, children? }   (children only on "repeat")
// Every helper returns new arrays; nothing is mutated.

let nextStackId = 1;

const mapChildren = (list, fn) =>
  list.map((block) =>
    block.children ? { ...block, children: fn(block.children) } : block
  );

export function updateInputs(stacks, blockId, name, value) {
  const update = (list) =>
    mapChildren(list, update).map((block) =>
      block.id === blockId
        ? { ...block, inputs: { ...block.inputs, [name]: value } }
        : block
    );
  return stacks.map((stack) => ({ ...stack, blocks: update(stack.blocks) }));
}

// Cuts `blockId` and every block below it in the same list (Scratch drags
// the tail of a stack together). Returns null when the block isn't found.
function cutFromList(list, blockId) {
  const index = list.findIndex(({ id }) => id === blockId);
  if (index !== -1) {
    return { list: list.slice(0, index), chain: list.slice(index) };
  }
  for (let i = 0; i < list.length; i++) {
    if (!list[i].children) continue;
    const result = cutFromList(list[i].children, blockId);
    if (result) {
      const updated = [...list];
      updated[i] = { ...list[i], children: result.list };
      return { list: updated, chain: result.chain };
    }
  }
  return null;
}

export function detachChain(stacks, blockId) {
  for (const stack of stacks) {
    const result = cutFromList(stack.blocks, blockId);
    if (!result) continue;
    const remaining = result.list.length
      ? stacks.map((s) => (s === stack ? { ...s, blocks: result.list } : s))
      : stacks.filter((s) => s !== stack);
    return { stacks: remaining, chain: result.chain };
  }
  return { stacks, chain: [] };
}

function insertAfter(list, blockId, chain) {
  const index = list.findIndex(({ id }) => id === blockId);
  if (index !== -1) {
    return [...list.slice(0, index + 1), ...chain, ...list.slice(index + 1)];
  }
  return mapChildren(list, (children) => insertAfter(children, blockId, chain));
}

function insertInside(list, blockId, chain) {
  return mapChildren(list, (children) =>
    insertInside(children, blockId, chain)
  ).map((block) =>
    block.id === blockId
      ? { ...block, children: [...chain, ...block.children] }
      : block
  );
}

// target.kind: "after" a block, "inside" a repeat's mouth,
// "before" a stack's first block, or "new" stack at (x, y).
export function insertChain(stacks, target, chain) {
  switch (target.kind) {
    case "after":
      return stacks.map((stack) => ({
        ...stack,
        blocks: insertAfter(stack.blocks, target.blockId, chain),
      }));
    case "inside":
      return stacks.map((stack) => ({
        ...stack,
        blocks: insertInside(stack.blocks, target.blockId, chain),
      }));
    case "before":
      return stacks.map((stack) =>
        stack.id === target.stackId
          ? {
              ...stack,
              y: Math.max(0, stack.y - target.height),
              blocks: [...chain, ...stack.blocks],
            }
          : stack
      );
    default:
      return [
        ...stacks,
        { id: `stack${nextStackId++}`, x: target.x, y: target.y, blocks: chain },
      ];
  }
}

// Deletes one block (a repeat goes with the blocks inside it); the blocks
// below it move up to close the gap. A stack left empty is removed.
export function removeBlock(stacks, blockId) {
  const remove = (list) =>
    mapChildren(
      list.filter(({ id }) => id !== blockId),
      remove
    );
  return stacks
    .map((stack) => ({ ...stack, blocks: remove(stack.blocks) }))
    .filter(({ blocks }) => blocks.length);
}

export function collectIds(blocks, ids = new Set()) {
  blocks.forEach((block) => {
    ids.add(block.id);
    if (block.children) collectIds(block.children, ids);
  });
  return ids;
}
