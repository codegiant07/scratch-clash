// Scratch stage: 480 x 360, origin in the centre, y grows upwards.
export const STAGE_WIDTH = 480;
export const STAGE_HEIGHT = 360;
export const SPRITE_WIDTH = 95;
export const SPRITE_HEIGHT = 100;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Keep the sprite's centre on the stage, like Scratch's fencing.
export function clampToStage(x, y) {
  return {
    x: clamp(x, -STAGE_WIDTH / 2, STAGE_WIDTH / 2),
    y: clamp(y, -STAGE_HEIGHT / 2, STAGE_HEIGHT / 2),
  };
}
