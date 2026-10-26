import React from "react";
import Block from "./Block";
import BlockBody, { NOTCH_LEFT } from "./BlockBody";
import { BLOCK_TYPES, CATEGORIES } from "../blocks/blockTypes";

// Width of the left arm of a C-shaped block.
export const ARM_WIDTH = 16;

// One block plus, for "repeat", the blocks inside its mouth.
// The data-* attributes are read by the drag code to find snap points.
// `zIndex` keeps upper blocks on top so their tab covers the notch below.
// `onDelete(blockId)` is only passed in the script area, so palette blocks
// and the drag preview have no ✕ button.
export default function ScriptBlock({
  block,
  onInputChange,
  onPointerDown,
  onDelete,
  zIndex,
}) {
  const definition = BLOCK_TYPES[block.type];
  const handleInputChange =
    onInputChange && ((name, value) => onInputChange(block.id, name, value));
  const handlePointerDown =
    onPointerDown && ((event) => onPointerDown(event, block));
  const handleDelete = onDelete && (() => onDelete(block.id));
  const rootProps = {
    "data-block-id": block.id,
    onPointerDown: handlePointerDown,
    className: "relative flex flex-col items-start select-none",
    // touchAction lets touch screens drag blocks instead of scrolling the page
    style: { touchAction: "none", zIndex },
  };

  if (!definition.hasChildren) {
    return (
      <div {...rootProps}>
        <Block
          block={block}
          onInputChange={handleInputChange}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  const color = CATEGORIES[definition.category].color;
  return (
    <div {...rootProps}>
      <div data-mouth-of={block.id} className="relative" style={{ zIndex: 3 }}>
        <Block
          block={block}
          onInputChange={handleInputChange}
          onDelete={handleDelete}
          tabLeft={ARM_WIDTH + NOTCH_LEFT}
        />
      </div>
      {/* Above the header so the arm hides the header's shadow where they join;
          the header's tab still shows through the first child's notch */}
      <div className="relative flex flex-row" style={{ zIndex: 4 }}>
        <div
          style={{ width: ARM_WIDTH, marginTop: -2, backgroundColor: color }}
        />
        <div className="flex flex-col items-start" style={{ minHeight: 24 }}>
          <BlockList
            blocks={block.children}
            onInputChange={onInputChange}
            onPointerDown={onPointerDown}
            onDelete={onDelete}
          />
        </div>
      </div>
      {/* Bottom arm: its notch sits under the mouth, its tab connects the next block */}
      <BlockBody
        color={color}
        notchLeft={ARM_WIDTH + NOTCH_LEFT}
        radius="0 4px 4px 4px"
      >
        <div style={{ width: 80, height: 18 }} />
      </BlockBody>
    </div>
  );
}

export function BlockList({ blocks, onInputChange, onPointerDown, onDelete }) {
  return blocks.map((block, index) => (
    <ScriptBlock
      key={block.id}
      block={block}
      onInputChange={onInputChange}
      onPointerDown={onPointerDown}
      onDelete={onDelete}
      zIndex={blocks.length - index}
    />
  ));
}
