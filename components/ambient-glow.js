// Centralizes the drifting radial-gradient "blob" backdrop that used to be
// copy-pasted inline on every directory/profile page with slightly different
// positions each time. Each variant anchors its blobs differently so pages
// still feel distinct from one another instead of visually cloned.
const VARIANTS = {
  default: [
    { pos: "-top-24 left-[8%] h-80 w-80", color: "var(--color-accent)", opacity: 26 },
    { pos: "-bottom-24 right-[10%] h-96 w-96", color: "var(--color-accent-2)", opacity: 22 },
  ],
  directory: [
    { pos: "-top-40 left-[10%] h-112 w-md", color: "var(--color-accent)", opacity: 32 },
    { pos: "top-1/3 -right-32 h-128 w-lg", color: "var(--color-accent-2)", opacity: 26 },
    { pos: "bottom-0 left-[20%] h-104 w-104", color: "var(--color-accent)", opacity: 20 },
  ],
  profile: [
    { pos: "-top-32 left-1/2 h-125 w-125 -translate-x-1/2", color: "var(--color-accent)", opacity: 18 },
    { pos: "top-1/2 -right-40 h-96 w-96", color: "var(--color-accent-2)", opacity: 16 },
  ],
  single: [{ pos: "top-0 right-[-10%] h-125 w-125", color: "var(--color-accent-2)", opacity: 20 }],
};

export function AmbientGlow({ variant = "default", className = "" }) {
  const blobs = VARIANTS[variant] || VARIANTS.default;

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      {blobs.map((blob, i) => (
        <div
          key={i}
          className={`absolute rounded-full blur-3xl ${blob.pos}`}
          style={{
            background: `radial-gradient(circle, color-mix(in oklch, ${blob.color} ${blob.opacity}%, transparent), transparent 70%)`,
          }}
        />
      ))}
    </div>
  );
}
