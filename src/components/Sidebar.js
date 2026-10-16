import React, { useRef, useState } from "react";
import ScriptBlock from "./ScriptBlock";
import { BLOCK_TYPES, CATEGORIES, createBlock } from "../blocks/blockTypes";
import { runStack } from "../engine/runScript";
import { useDrag } from "../state/DragContext";
import { useSprites } from "../state/SpritesContext";

const CATEGORY_IDS = Object.keys(CATEGORIES);

export default function Sidebar() {
  const engine = useSprites();
  const { startPointer, paletteRef } = useDrag();
  // Palette blocks keep their own input values, like Scratch
  const [paletteBlocks, setPaletteBlocks] = useState(() =>
    Object.keys(BLOCK_TYPES).map(createBlock)
  );
  const [activeCategory, setActiveCategory] = useState(CATEGORY_IDS[0]);
  const scrollRef = useRef(null);
  const headingRefs = useRef({});

  const changeInput = (blockId, name, value) =>
    setPaletteBlocks((blocks) =>
      blocks.map((block) =>
        block.id === blockId
          ? { ...block, inputs: { ...block.inputs, [name]: value } }
          : block
      )
    );

  // Drag copies the block into the workspace; a plain click runs it
  const handlePointerDown = (event, block) =>
    startPointer(event, {
      source: "palette",
      block,
      onClick: () => runStack([block], engine.getState().selectedId, engine),
    });

  const scrollToCategory = (categoryId) => {
    scrollRef.current.scrollTo({
      top: headingRefs.current[categoryId].offsetTop - 8,
      behavior: "smooth",
    });
    setActiveCategory(categoryId);
  };

  // Highlight the category whose section is at the top of the palette
  const handleScroll = () => {
    const top = scrollRef.current.scrollTop + 16;
    const current = CATEGORY_IDS.filter(
      (id) => headingRefs.current[id].offsetTop <= top
    ).pop();
    if (current) setActiveCategory(current);
  };

  return (
    // The whole sidebar (rail + palette) is the "drop here to delete" area
    <div
      ref={paletteRef}
      className="w-80 flex-none h-full flex flex-row border-r border-gray-200"
    >
      <div className="w-16 flex-none h-full flex flex-col items-center py-1 border-r border-gray-200">
        {CATEGORY_IDS.map((categoryId) => (
          <button
            key={categoryId}
            type="button"
            data-category={categoryId}
            onClick={() => scrollToCategory(categoryId)}
            className={`w-full flex flex-col items-center py-2 focus:outline-none ${
              activeCategory === categoryId ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
          >
            <span
              className="w-5 h-5 rounded-full border"
              style={{
                backgroundColor: CATEGORIES[categoryId].color,
                borderColor: "rgba(0, 0, 0, 0.15)",
              }}
            />
            <span className="text-xs text-gray-600 mt-1">
              {CATEGORIES[categoryId].name}
            </span>
          </button>
        ))}
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 h-full overflow-y-auto flex flex-col items-start p-2"
      >
        {CATEGORY_IDS.map((categoryId) => (
          <React.Fragment key={categoryId}>
            <div
              ref={(element) => (headingRefs.current[categoryId] = element)}
              className="font-bold"
            >
              {CATEGORIES[categoryId].name}
            </div>
            {paletteBlocks
              .filter(({ type }) => BLOCK_TYPES[type].category === categoryId)
              .map((block) => (
                <div key={block.id} className="my-2">
                  <ScriptBlock
                    block={block}
                    onInputChange={changeInput}
                    onPointerDown={handlePointerDown}
                  />
                </div>
              ))}
          </React.Fragment>
        ))}
        {/* One panel of room to scroll, so even the last category can reach the top */}
        <div className="flex-none h-full" />
      </div>
    </div>
  );
}
