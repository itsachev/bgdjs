const DIRECTIONS = {
  right: "to right",
  left: "to left",
  top: "to top",
  bottom: "to bottom",
  "top-right": "to top right",
  "top-left": "to top left",
  "bottom-right": "to bottom right",
  "bottom-left": "to bottom left",
};

// Fades an edge of its children into the page background instead of cutting
// them off with a hard border — e.g. a right-edge panel image that dissolves
// into the surrounding layout rather than ending in a visible line. The
// gradient is a separate layer stacked above the children, not a CSS mask,
// so it blends to an actual color (the body background) rather than to
// transparency.
export function GradientMask({ direction = "right", className = "", children }) {
  const cssDirection = DIRECTIONS[direction] || direction;

  return (
    <div className={`relative ${className}`}>
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(${cssDirection}, transparent, var(--color-bg))` }}
      />
    </div>
  );
}
