import React from "react";
import CatSprite from "./CatSprite";
import BumpEffect from "./BumpEffect";
import Icon from "./Icon";
import SpeechBubble from "./SpeechBubble";
import SpriteList from "./SpriteList";
import {
  playAll,
  resetStage,
  startHatScripts,
  stopAll,
} from "../engine/runScript";
import {
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from "../engine/stage";
import { useSprites } from "../state/SpritesContext";

const percent = (value) => `${value * 100}%`;

export default function PreviewArea() {
  const engine = useSprites();
  const { state, dispatch } = engine;
  const selected = state.sprites.find(({ id }) => id === state.selectedId);

  return (
    <div className="flex-1 h-full overflow-y-auto p-2">
      <div className="flex flex-row items-center mb-2">
        <button
          type="button"
          title="Play"
          onClick={() => playAll(engine)}
          className="p-1 mr-2 rounded hover:bg-gray-100 focus:outline-none"
        >
          <Icon name="flag" size={20} className="text-green-600" />
        </button>
        <button
          type="button"
          title="Stop"
          onClick={() => stopAll(engine)}
          className="p-1 rounded hover:bg-gray-100 focus:outline-none"
        >
          <Icon name="stop" size={20} className="text-red-600" />
        </button>
        <button
          type="button"
          title="Reset"
          onClick={() => resetStage(engine)}
          className="flex flex-row items-center ml-2 px-2 py-1 text-sm text-gray-700 rounded border border-gray-300 hover:bg-gray-100 focus:outline-none"
        >
          <Icon name="undo-alt" size={12} className="text-gray-700 mr-1" />
          {"Reset"}
        </button>
      </div>
      {/* Stage keeps Scratch's 4:3 shape at any panel width */}
      <div
        className="relative w-full overflow-hidden border border-gray-200 rounded-lg"
        style={{ paddingTop: percent(STAGE_HEIGHT / STAGE_WIDTH) }}
      >
        {state.sprites.map((sprite) => (
          <div
            key={sprite.id}
            className="absolute cursor-pointer"
            // Clicking a sprite selects it and runs its "when this sprite clicked" scripts
            onClick={() => {
              dispatch({ type: "SELECT_SPRITE", id: sprite.id });
              startHatScripts("whenSpriteClicked", engine, [sprite.id]);
            }}
            style={{
              width: percent(SPRITE_WIDTH / STAGE_WIDTH),
              left: percent((sprite.x + STAGE_WIDTH / 2) / STAGE_WIDTH),
              top: percent((STAGE_HEIGHT / 2 - sprite.y) / STAGE_HEIGHT),
              transform: `translate(-50%, -50%) rotate(${
                sprite.direction - 90
              }deg)${sprite.mirrored ? " scaleX(-1)" : ""}`,
            }}
          >
            {/* A new key on every bump remounts this, replaying the wobble */}
            <div
              key={sprite.bumps}
              className={sprite.bumps ? "animate-wobble" : ""}
            >
              <CatSprite
                hue={sprite.hue}
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            </div>
          </div>
        ))}
        {state.effects.map((effect) => (
          <BumpEffect
            key={effect.id}
            effect={effect}
            onDone={() => dispatch({ type: "REMOVE_EFFECT", id: effect.id })}
          />
        ))}
        {/* Bubbles sit above the sprite's head and don't rotate with it */}
        {state.sprites
          .filter(({ bubble }) => bubble)
          .map((sprite) => {
            // Open towards the stage centre so the bubble isn't cut off
            const flip = sprite.x > 0;
            return (
              <div
                key={`bubble-${sprite.id}`}
                className="absolute pointer-events-none z-10 pb-5"
                style={{
                  left: percent((sprite.x + STAGE_WIDTH / 2) / STAGE_WIDTH),
                  top: percent(
                    (STAGE_HEIGHT / 2 - sprite.y - SPRITE_HEIGHT / 2) /
                      STAGE_HEIGHT
                  ),
                  transform: flip
                    ? "translate(-100%, -100%)"
                    : "translate(0, -100%)",
                }}
              >
                <SpeechBubble bubble={sprite.bubble} flip={flip} />
              </div>
            );
          })}
      </div>
      {selected && (
        <div className="flex flex-row flex-wrap mt-2 text-sm text-gray-700">
          <span className="font-bold mr-4">{selected.name}</span>
          <span className="mr-4">{`x: ${Math.round(selected.x)}`}</span>
          <span className="mr-4">{`y: ${Math.round(selected.y)}`}</span>
          <span>{`direction: ${Math.round(selected.direction)}`}</span>
        </div>
      )}
      <SpriteList />
    </div>
  );
}
