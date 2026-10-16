import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

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
    hue: SPRITE_HUES[(number - 1) % SPRITE_HUES.length],
    bubble: null,
    stacks: [],
  };
}

let nextSpriteNumber = 2;
const randomBetween = (min, max) => Math.round(min + Math.random() * (max - min));

// New sprites appear at a random spot on the stage, like Scratch.
export function newSprite() {
  return createSprite(
    nextSpriteNumber++,
    randomBetween(-180, 180),
    randomBetween(-120, 120)
  );
}

const initialState = {
  sprites: [createSprite(1)],
  selectedId: "sprite1",
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
