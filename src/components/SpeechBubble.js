import React from "react";

// "say" = rounded box with a pointed tail; "think" = cloud with small circles.
// `flip` moves the tail to the right when the bubble opens to the left.
export default function SpeechBubble({ bubble, flip }) {
  const isThink = bubble.kind === "think";
  const side = flip ? "right" : "left";

  return (
    <div
      className={`relative bg-white border-2 border-gray-300 text-gray-800 text-sm px-3 py-2 ${
        isThink ? "rounded-3xl" : "rounded-xl"
      }`}
      style={{ maxWidth: 180, width: "max-content", wordBreak: "break-word" }}
    >
      {bubble.text}
      {isThink ? (
        <>
          <span
            className="absolute w-3 h-3 bg-white border-2 border-gray-300 rounded-full"
            style={{ bottom: -12, [side]: 16 }}
          />
          <span
            className="absolute w-2 h-2 bg-white border-2 border-gray-300 rounded-full"
            style={{ bottom: -20, [side]: 8 }}
          />
        </>
      ) : (
        <span
          className="absolute w-3 h-3 bg-white border-b-2 border-r-2 border-gray-300 transform rotate-45"
          style={{ bottom: -7, [side]: 14 }}
        />
      )}
    </div>
  );
}
