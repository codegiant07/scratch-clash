// Sidebar categories, in display order, with Scratch's own block colours.
export const CATEGORIES = {
  motion: { name: "Motion", color: "#4C97FF" },
  looks: { name: "Looks", color: "#9966FF" },
  events: { name: "Events", color: "#FFBF00" },
  control: { name: "Control", color: "#FFAB19" },
};

// Every block the editor knows about. `parts` describes the label:
// a string is text, { icon } is an Icon, { input } is an editable number
// ({ input, text: true } accepts any text).
// `hat` blocks can only start a stack; `hasChildren` blocks wrap other blocks.
export const BLOCK_TYPES = {
  whenFlagClicked: {
    category: "events",
    hat: true,
    parts: ["When", { icon: "flag", className: "text-green-600" }, "clicked"],
  },
  whenSpriteClicked: {
    category: "events",
    hat: true,
    parts: ["When this sprite clicked"],
  },
  move: {
    category: "motion",
    parts: ["Move", { input: "steps" }, "steps"],
    defaults: { steps: 10 },
  },
  turnLeft: {
    category: "motion",
    parts: [
      "Turn",
      { icon: "undo", className: "text-white" },
      { input: "degrees" },
      "degrees",
    ],
    defaults: { degrees: 15 },
  },
  turnRight: {
    category: "motion",
    parts: [
      "Turn",
      { icon: "redo", className: "text-white" },
      { input: "degrees" },
      "degrees",
    ],
    defaults: { degrees: 15 },
  },
  goTo: {
    category: "motion",
    parts: ["Go to x:", { input: "x" }, "y:", { input: "y" }],
    defaults: { x: 0, y: 0 },
  },
  sayFor: {
    category: "looks",
    parts: [
      "Say",
      { input: "message", text: true },
      "for",
      { input: "seconds" },
      "seconds",
    ],
    defaults: { message: "Hello!", seconds: 2 },
  },
  thinkFor: {
    category: "looks",
    parts: [
      "Think",
      { input: "message", text: true },
      "for",
      { input: "seconds" },
      "seconds",
    ],
    defaults: { message: "Hmm...", seconds: 2 },
  },
  repeat: {
    category: "control",
    hasChildren: true,
    parts: ["Repeat", { input: "times" }],
    defaults: { times: 10 },
  },
};

let nextBlockId = 1;

export function createBlock(type) {
  const block = {
    id: `block${nextBlockId++}`,
    type,
    inputs: { ...BLOCK_TYPES[type].defaults },
  };
  return BLOCK_TYPES[type].hasChildren ? { ...block, children: [] } : block;
}

// Deep copy with fresh ids, used when a palette block is dragged out.
export function cloneBlock(block) {
  const copy = { ...block, id: `block${nextBlockId++}`, inputs: { ...block.inputs } };
  return block.children
    ? { ...copy, children: block.children.map(cloneBlock) }
    : copy;
}
