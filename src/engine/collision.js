import { SPRITE_HEIGHT, SPRITE_WIDTH } from "./stage";

// The cat doesn't fill its whole image, so use a slightly smaller hit box.
const HITBOX_SCALE = 0.8;

export function spritesOverlap(a, b) {
  return (
    Math.abs(a.x - b.x) < SPRITE_WIDTH * HITBOX_SCALE &&
    Math.abs(a.y - b.y) < SPRITE_HEIGHT * HITBOX_SCALE
  );
}

// Pairs that are overlapping right now. A pair only counts as a new
// collision when it starts overlapping, not on every frame while it overlaps.
const touchingPairs = new Set();
const pairKey = (idA, idB) => [idA, idB].sort().join("|");

// Returns the sprites that `spriteId` has just started touching.
export function findNewCollisions(spriteId, sprites) {
  const sprite = sprites.find(({ id }) => id === spriteId);
  if (!sprite) return [];
  return sprites.filter((other) => {
    if (other.id === spriteId) return false;
    const key = pairKey(spriteId, other.id);
    if (!spritesOverlap(sprite, other)) {
      touchingPairs.delete(key);
      return false;
    }
    if (touchingPairs.has(key)) return false;
    touchingPairs.add(key);
    return true;
  });
}
