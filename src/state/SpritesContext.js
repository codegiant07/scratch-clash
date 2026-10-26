import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { spritesOverlap } from "../engine/collision";
import { clampToStage } from "../engine/stage";

// Each sprite gets a different colour tint so they're easy to tell apart.
const SPRITE_HUES = [0, 120, 240, 60, 180, 300];

function createSprite(number, x = 0, y = 0) {
  return {
    id: `sprite${number}`,
    name: `Sprite${number}`,
    x,
    y,
    direction: 90,
    // true = image mirrored, so the cat faces the way it's walking (see "move")
    mirrored: false,
    // Counts Hero bumps; each change replays the wobble animation on the stage
    bumps: 0,
    hue: SPRITE_HUES[(number - 1) % SPRITE_HUES.length],
    // Where Reset puts the sprite back: where it was added, then where it was
    // each time Play was pressed
    start: { x, y, direction: 90 },
    bubble: null,
    stacks: [],
  };
}

let nextSpriteNumber = 2;
const randomBetween = (min, max) =>
  Math.round(min + Math.random() * (max - min));

// Lanes are further apart than the 80px collision box, so sprites running
// side by side never trigger the Hero swap by accident.
const LANE_YS = [0, -90, 90];
const COLUMN_OFFSETS = [0, -120, 120];

// New sprites line up under the first sprite (same x) in the first free lane,
// so "Play" visibly runs them side by side. Random spot only when all are taken.
export function newSprite(sprites) {
  const baseX = sprites[0].x;
  const slots = COLUMN_OFFSETS.flatMap((offset) =>
    LANE_YS.map((y) => clampToStage(baseX + offset, y))
  );
  const free = slots.find(
    (slot) => !sprites.some((sprite) => spritesOverlap(slot, sprite))
  );
  const { x, y } = free || {
    x: randomBetween(-180, 180),
    y: randomBetween(-120, 120),
  };
  return createSprite(nextSpriteNumber++, x, y);
}

const initialState = {
  sprites: [createSprite(1)],
  selectedId: "sprite1",
  // Short-lived "BUMP!" bursts on the stage: [{ id, x, y }]
  effects: [],
  // True once Play has saved the start points; only Reset clears it, so
  // Reset always returns to how things were before the first Play
  startsSaved: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "UPDATE_SPRITE":
      return {
        ...state,
        sprites: state.sprites.map((sprite) =>
          sprite.id === action.id ? { ...sprite, ...action.changes } : sprite
        ),
      };
    case "ADD_SPRITE":
      return {
        ...state,
        sprites: [...state.sprites, action.sprite],
        selectedId: action.sprite.id,
      };
    case "ADD_EFFECT":
      return { ...state, effects: [...state.effects, action.effect] };
    case "REMOVE_EFFECT":
      return {
        ...state,
        effects: state.effects.filter(({ id }) => id !== action.id),
      };
    case "SAVE_STARTS":
      // Already saved by an earlier Play: keep the original start points
      if (state.startsSaved) return state;
      return {
        ...state,
        startsSaved: true,
        sprites: state.sprites.map((sprite) => ({
          ...sprite,
          start: { x: sprite.x, y: sprite.y, direction: sprite.direction },
        })),
      };
    case "RESET_STAGE":
      return {
        ...state,
        sprites: state.sprites.map((sprite) => ({
          ...sprite,
          ...sprite.start,
          mirrored: false,
          bubble: null,
        })),
        effects: [],
        startsSaved: false,
      };
    case "SELECT_SPRITE":
      return { ...state, selectedId: action.id };
    case "DELETE_SPRITE": {
      const sprites = state.sprites.filter(({ id }) => id !== action.id);
      if (!sprites.length) return state; // always keep at least one sprite
      const selectedId =
        state.selectedId === action.id ? sprites[0].id : state.selectedId;
      return { ...state, sprites, selectedId };
    }
    default:
      return state;
  }
}

const SpritesContext = createContext(null);

export function SpritesProvider({ children }) {
  // The ref always holds the latest state, so the animation engine can read
  // positions synchronously between frames (React state updates are async).
  const stateRef = useRef(initialState);
  const [state, setState] = useState(initialState);

  const dispatch = useCallback((action) => {
    stateRef.current = reducer(stateRef.current, action);
    setState(stateRef.current);
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  const value = useMemo(
    () => ({ state, dispatch, getState }),
    [state, dispatch, getState]
  );

  return (
    <SpritesContext.Provider value={value}>{children}</SpritesContext.Provider>
  );
}

export function useSprites() {
  return useContext(SpritesContext);
}
