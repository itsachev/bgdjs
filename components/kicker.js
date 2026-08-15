export function Kicker({ children, className = "", tone = "accent" }) {
  const toneClass = tone === "muted" ? "text-foreground-muted" : "text-accent";

  return (
    <p
      className={`flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.3em] ${toneClass} ${className}`}
    >
      <span className="h-px w-6 bg-current" aria-hidden="true" />
      {children}
    </p>
  );
}
