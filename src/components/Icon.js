import React from "react";

export default function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={`fill-current ${className}`}
      width={size.toString() + "px"}
      height={size.toString() + "px"}
    >
      {/* Relative path so icons also load when the app is served from a
          sub-folder, e.g. GitHub Pages at /scratch-clash/ */}
      <use xlinkHref={`icons/solid.svg#${name}`} />
    </svg>
  );
}
