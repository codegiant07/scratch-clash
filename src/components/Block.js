import React from "react";
import BlockBody from "./BlockBody";
import Icon from "./Icon";
import { BLOCK_TYPES, CATEGORIES } from "../blocks/blockTypes";

// Allows partial numbers while typing: "", "-", "1.", "-2.5"
const NUMBER_PATTERN = /^-?\d*\.?\d*$/;

// The label row of a block, with its editable values, on a puzzle-piece shape.
// `tabLeft` moves the bottom tab (a C-block's tab sits inside its mouth).
// `onDelete` adds a ✕ button (only blocks in the script area get one).
export default function Block({ block, onInputChange, tabLeft, onDelete }) {
  const definition = BLOCK_TYPES[block.type];

  return (
    <BlockBody
      color={CATEGORIES[definition.category].color}
      hat={definition.hat}
      tabLeft={tabLeft}
      // A C-block's header joins its left arm, so that corner stays square
      radius={definition.hasChildren ? "4px 4px 4px 0" : "4px"}
      className={definition.hat ? "mt-3" : ""}
    >
      <div className="flex flex-row flex-wrap items-center text-white font-medium px-3 py-2 text-sm cursor-pointer">
        {definition.parts.map((part, index) => {
          if (typeof part === "string") {
            return <span key={index}>{part}</span>;
          }
          if (part.icon) {
            return (
              <Icon
                key={index}
                name={part.icon}
                size={15}
                className={`${part.className} mx-2`}
              />
            );
          }
          const value = String(block.inputs[part.input]);
          return (
            <input
              key={index}
              type="text"
              inputMode={part.text ? "text" : "decimal"}
              value={value}
              readOnly={!onInputChange}
              onChange={(event) => {
                const next = event.target.value;
                if (part.text || NUMBER_PATTERN.test(next)) {
                  onInputChange(part.input, next);
                }
              }}
              className="mx-1 px-1 py-0.5 rounded-full bg-white text-gray-700 text-center border border-black border-opacity-10 focus:outline-none"
              // Grow with the value: one "ch" per character plus room for padding
              style={{ width: `calc(${Math.max(value.length, 1)}ch + 12px)` }}
            />
          );
        })}
        {onDelete && (
          <button
            type="button"
            title="Delete block"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onDelete}
            className="ml-2 w-4 h-4 flex items-center justify-center rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 focus:outline-none"
          >
            <Icon name="times" size={8} className="text-white" />
          </button>
        )}
      </div>
    </BlockBody>
  );
}
