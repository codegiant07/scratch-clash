import React from "react";
import { BlockList } from "./ScriptBlock";
import { BLOCK_TYPES } from "../blocks/blockTypes";
import { removeBlock, updateInputs } from "../blocks/scriptTree";
import { runStack } from "../engine/runScript";
import { useDrag } from "../state/DragContext";
import { useSprites } from "../state/SpritesContext";

export default function MidArea() {
  const engine = useSprites();
  const { state, getState, dispatch } = engine;
  const { startPointer, workspaceRef } = useDrag();
  const sprite = state.sprites.find(({ id }) => id === state.selectedId);

  const latestStacks = () =>
    getState().sprites.find(({ id }) => id === sprite.id).stacks;
  const setStacks = (stacks) =>
    dispatch({ type: "UPDATE_SPRITE", id: sprite.id, changes: { stacks } });

  const changeInput = (blockId, name, value) =>
    setStacks(updateInputs(latestStacks(), blockId, name, value));
  const deleteBlock = (blockId) =>
    setStacks(removeBlock(latestStacks(), blockId));

  return (
    <div ref={workspaceRef} className="flex-1 h-full overflow-auto relative">
      {sprite.stacks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
          {"Drag blocks here"}
        </div>
      )}
      {sprite.stacks.map((stack) => (
        <div
          key={stack.id}
          data-stack-id={stack.id}
          data-hat={String(Boolean(BLOCK_TYPES[stack.blocks[0].type].hat))}
          className="absolute flex flex-col items-start"
          style={{ left: stack.x, top: stack.y }}
        >
          <BlockList
            blocks={stack.blocks}
            onInputChange={changeInput}
            onDelete={deleteBlock}
            // Drag moves the block and everything under it; a click runs the whole stack
            onPointerDown={(event, block) =>
              startPointer(event, {
                source: "workspace",
                block,
                onClick: () => {
                  const latest = latestStacks().find(({ id }) => id === stack.id);
                  if (latest) runStack(latest.blocks, sprite.id, engine, latest.id);
                },
              })
            }
          />
        </div>
      ))}
    </div>
  );
}
