import React from "react";

// Puzzle-piece geometry, in px. The notch is cut into a block's top edge and
// the tab hangs below its bottom edge, so a tab fills the notch of the block under it.
export const NOTCH_LEFT = 12;
const NOTCH_WIDTH = 28;
const NOTCH_DEPTH = 5;
const NOTCH_SLOPE = 6;

const notchClip = (left) =>
  `polygon(0 0, ${left}px 0, ${left + NOTCH_SLOPE}px ${NOTCH_DEPTH}px, ${
    left + NOTCH_WIDTH - NOTCH_SLOPE
  }px ${NOTCH_DEPTH}px, ${left + NOTCH_WIDTH}px 0, 100% 0, 100% 100%, 0 100%)`;

const tabClip = `polygon(0 0, 100% 0, ${NOTCH_WIDTH - NOTCH_SLOPE}px 100%, ${NOTCH_SLOPE}px 100%)`;

// The coloured Scratch-style shape behind a block's content.
// `hat` adds the dome on top (and no notch, since nothing can stack above a hat).
export default function BlockBody({
  color,
  hat = false,
  notchLeft = NOTCH_LEFT,
  tabLeft = NOTCH_LEFT,
  radius = "4px",
  className = "",
  children,
}) {
  return (
    <div
      className={`relative ${className}`}
      // The shadow follows the clipped shape, so it outlines the notch and tab too
      style={{ filter: "drop-shadow(0 1px 0 rgba(0, 0, 0, 0.25))" }}
    >
      {hat && (
        <div
          className="absolute"
          style={{
            left: 0,
            top: -10,
            width: 72,
            height: 24,
            borderRadius: "50%",
            backgroundColor: color,
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: color,
          borderRadius: hat ? "0 4px 4px 4px" : radius,
          clipPath: hat ? undefined : notchClip(notchLeft),
        }}
      />
      <div
        className="absolute"
        style={{
          left: tabLeft,
          // 1px overlap avoids a hairline gap between the body and the tab
          top: "calc(100% - 1px)",
          width: NOTCH_WIDTH,
          height: NOTCH_DEPTH + 1,
          backgroundColor: color,
          clipPath: tabClip,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
