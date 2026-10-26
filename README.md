# Scratch Clash

**🔗 Live demo:** https://codegiant07.github.io/scratch-clash/
<!-- 🎥 Video walkthrough: add the video link here -->

A Scratch-style visual coding playground built with **React** and **Tailwind CSS**.
Drag blocks into scripts, give each sprite its own script, press the green flag, and watch
the **Hero Feature**: when two sprites collide, they swap animations.

ReactJS challenge — *"Build a visual coding environment"*.

## Run locally

```bash
npm i
npm start          # http://localhost:3000
npm run build      # production build (outputs app.js / app.css into public/)
```

## Features

| Area | What you can do |
|---|---|
| **Motion** | `Move ___ steps`, `Turn ↺ / ↻ ___ degrees`, `Go to x: ___ y: ___` |
| **Control** | `Repeat ___` (C-shaped block; blocks inside animate one frame per pass) |
| **Looks** | `Say ___ for ___ seconds`, `Think ___ for ___ seconds` (speech / thought bubbles) |
| **Events** | `When 🏁 clicked`, `When this sprite clicked` |
| **Drag and drop** | Drag from the palette, snap blocks together (Lego-style notches), drop inside `Repeat`, drag a block to take the blocks below it |
| **Delete** | Click the ✕ on a block to delete just that block (a `Repeat` goes with the blocks inside it), or drag blocks back onto the palette |
| **Multiple sprites** | **+ Add sprite** (new sprites line up in lanes), each sprite has its own scripts, click a tile or a cat to select it |
| **Play / Stop / Reset** | 🏁 runs every script on all sprites at once (`When this sprite clicked` scripts wait for their click); 🟥 stops everything; **Reset** puts every sprite back where it was before Play was first pressed |
| **Hero Feature** | Sprites that collide swap animations, with a "BUMP!" burst |

Extras: Scratch category rail, number-only inputs, cats face the way they walk, coloured sprites.

## Demo: the Hero Feature (2 minutes)

1. **Sprite1** (orange): build
   `When 🏁 clicked → Go to x: -150 y: 0 → Repeat 100 { Move 3 steps }`
2. Click **+ Add sprite**. For **Sprite2** (green) build
   `When 🏁 clicked → Go to x: 150 y: 0 → Repeat 100 { Move -3 steps }`
3. Press 🏁.

```
 🐱→ →→→          ←←← ←🐱     walk towards each other
          💥 BUMP!            collide → animations swap (once)
 ←🐱 ←←←          →→→ 🐱→     each carries on with the other's animation
```

After the bump, Sprite1 runs `Move -3` and Sprite2 runs `Move 3`, exactly like the brief's
example. Each sprite's own script is unchanged, so pressing 🏁 again starts fresh.

## How it works

```
┌──────────────────────────────────────────────────────┐
│ Store (React Context)                                │
│   sprites: [{ x, y, direction, bubble, stacks }]     │
└────────▲──────────────────────────┬──────────────────┘
         │ dispatch                 │ state
┌────────┴─────────┐      ┌─────────▼──────────────────┐
│ Engine           │      │ UI                         │
│ runScript.js     │      │ Sidebar · MidArea · Stage  │
│ collision.js     │      │ DragContext (drag & drop)  │
└──────────────────┘      └────────────────────────────┘
```

- **Blocks are data.** A script is a list of `{ type, inputs, children }` objects;
  the palette, editor and engine all read the same catalog (`src/blocks/blockTypes.js`).
- **Engine.** Each script is an `async` function. Scripts on different sprites take turns
  on one thread, so they run side by side. `Repeat` waits one frame (1/30 s) per pass, which
  is what makes motion animate; `Say`/`Think` await a timer.
- **Scratch maths.** Direction 0 = up, 90 = right, so `x += steps·sin(θ)`, `y += steps·cos(θ)`.
- **Stop.** A generation counter; every running script checks it before each block.
- **Collision.** Box overlap (80 % hit box) after each move. A pair counts as a new collision
  only when it *starts* overlapping, so one bump = one swap.
- **Swap.** Each running script knows which sprite it drives; on a bump the two sprites
  exchange their running animations and continue from where they were. Nothing restarts,
  so setup blocks such as `Go to` don't run again.

## Project structure

```
src/
  blocks/      blockTypes.js (block catalog) · scriptTree.js (insert / detach helpers)
  engine/      runScript.js (runner, Play/Stop, swap) · collision.js · stage.js
  state/       SpritesContext.js (store) · DragContext.js (drag & drop, snapping)
  components/  Sidebar · MidArea · PreviewArea · ScriptBlock · Block · BlockBody
               SpriteList · SpeechBubble · BumpEffect · CatSprite · Icon
```

## Tech

React 17 · Tailwind CSS 2 · webpack 5 · plain JavaScript (the brief prefers ReScript;
JavaScript is accepted). No extra runtime dependencies.

## Limitations

- Only the blocks listed in the brief are implemented (no costumes, sounds or variables).
- Collision uses bounding boxes, not pixel-perfect shapes like Scratch.
- Projects are not saved; reloading the page resets everything.
- Built for desktop; dragging works with touch, but the layout is not tuned for phones.
