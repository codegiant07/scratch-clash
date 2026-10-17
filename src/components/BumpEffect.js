import React from "react";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../engine/stage";

const percent = (value) => `${value * 100}%`;

// 12-spike cartoon star, drawn once: spikes alternate between two radii.
const STAR_POINTS = Array.from({ length: 24 }, (_, index) => {
  const radius = index % 2 ? 22 : 40;
  const angle = (index * Math.PI) / 12;
  return `${40 + radius * Math.cos(angle)},${40 + radius * Math.sin(angle)}`;
}).join(" ");

// "BUMP!" burst shown where two sprites collide. It removes itself
// (via onDone) as soon as its pop-and-fade animation finishes.
export default function BumpEffect({ effect, onDone }) {
  return (
    <div
      className="absolute pointer-events-none z-20 animate-burst"
      style={{
        left: percent((effect.x + STAGE_WIDTH / 2) / STAGE_WIDTH),
        top: percent((STAGE_HEIGHT / 2 - effect.y) / STAGE_HEIGHT),
      }}
      onAnimationEnd={onDone}
    >
      <svg width="80" height="80" viewBox="0 0 80 80">
        <polygon
          points={STAR_POINTS}
          fill="#FFD43B"
          stroke="#F59F00"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text
          x="40"
          y="45"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#C2410C"
        >
          {"BUMP!"}
        </text>
      </svg>
    </div>
  );
}
