import React from "react";
import CatSprite from "./CatSprite";
import Icon from "./Icon";
import { newSprite, useSprites } from "../state/SpritesContext";

// Sprite tiles under the stage: click to edit a sprite's scripts, add or delete sprites.
export default function SpriteList() {
  const { state, dispatch } = useSprites();
  const canDelete = state.sprites.length > 1;

  return (
    <div className="mt-3 pt-2 border-t border-gray-200">
      <div className="flex flex-row items-center justify-between mb-2">
        <span className="font-bold text-sm">{"Sprites"}</span>
        <button
          type="button"
          title="Add sprite"
          onClick={() =>
            dispatch({ type: "ADD_SPRITE", sprite: newSprite(state.sprites) })
          }
          className="flex flex-row items-center px-2 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none"
        >
          <Icon name="plus" size={12} className="text-white mr-1" />
          {"Add sprite"}
        </button>
      </div>
      <div className="flex flex-row flex-wrap">
        {state.sprites.map((sprite) => {
          const isSelected = sprite.id === state.selectedId;
          return (
            <div
              key={sprite.id}
              data-sprite-tile={sprite.id}
              onClick={() => dispatch({ type: "SELECT_SPRITE", id: sprite.id })}
              className={`relative w-20 p-1 m-1 flex flex-col items-center rounded-lg border-2 cursor-pointer ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="w-10">
                <CatSprite
                  hue={sprite.hue}
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </div>
              <span className="text-xs mt-1">{sprite.name}</span>
              {isSelected && canDelete && (
                <button
                  type="button"
                  title="Delete sprite"
                  onClick={(event) => {
                    event.stopPropagation();
                    dispatch({ type: "DELETE_SPRITE", id: sprite.id });
                  }}
                  className="absolute top-0 right-0 -mt-2 -mr-2 p-1 rounded-full bg-blue-500 hover:bg-red-500 focus:outline-none"
                >
                  <Icon name="trash" size={10} className="text-white" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
