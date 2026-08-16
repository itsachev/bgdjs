const BRAND_GRADIENT =
  "bg-[linear-gradient(135deg,var(--color-accent-2),color-mix(in_oklch,var(--color-accent-2)_45%,var(--color-accent)))]";

function AdBadge({ label }) {
  return (
    <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-accent-2">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-accent-2 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-2" />
      </span>
      {label}
    </p>
  );
}

// Placeholder ad unit — not wired to a real ad network. Uses accent-2 (the
// site's secondary/teal accent) instead of the primary accent so paid media
// stays visually distinct from organic "featured" content, and a dashed
// border keeps it honestly legible as an ad rather than a native card.
export function AdSlot({ variant = "banner", label, brand, headline, body, ctaLabel, className = "" }) {
  if (variant === "card") {
    return (
      <div
        className={`group relative flex aspect-3/4 flex-col justify-between overflow-hidden rounded-2xl border border-dashed border-accent-2/50 bg-[linear-gradient(150deg,color-mix(in_oklch,var(--color-accent-2)_16%,var(--color-background-elevated)),color-mix(in_oklch,var(--color-accent)_16%,var(--color-background-elevated)))] p-4 transition-[translate,border-color] duration-500 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-accent-2 ${className}`}
      >
        <span className="self-end rounded-full bg-background-elevated/90 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-accent-2 backdrop-blur-sm">
          {label}
        </span>
        <div>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl font-display text-sm font-black text-black/80 ${BRAND_GRADIENT}`}
          >
            {brand.slice(0, 2).toUpperCase()}
          </div>
          <p className="mt-3 font-display font-semibold tracking-tight">{brand}</p>
          <p className="mt-1 text-xs text-foreground-muted">{headline}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent-2 transition-transform [@media(hover:hover)]:group-hover:translate-x-0.5">
            {ctaLabel} →
          </p>
        </div>
      </div>
    );
  }

  if (variant === "event") {
    return (
      <div
        className={`group relative flex flex-col overflow-hidden rounded-2xl border border-dashed border-accent-2/50 bg-background-elevated/40 ${className}`}
      >
        <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden bg-[linear-gradient(135deg,color-mix(in_oklch,var(--color-accent-2)_20%,var(--color-background-elevated)),color-mix(in_oklch,var(--color-accent)_20%,var(--color-background-elevated)))]">
          <span className="font-display text-4xl font-black text-white/70">{brand.slice(0, 2).toUpperCase()}</span>
          <span className="absolute left-3 top-3 rounded-xl border border-accent-2/60 bg-background/90 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-accent-2 backdrop-blur-md">
            {label}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <p className="font-display font-semibold tracking-tight">{brand}</p>
          <p className="text-xs text-foreground-muted">{headline}</p>
          <p className="mt-auto inline-flex w-fit items-center gap-1 self-start rounded-full bg-accent-2/10 px-3 py-1 text-xs font-medium text-accent-2 transition-transform [@media(hover:hover)]:group-hover:translate-x-0.5">
            {ctaLabel} →
          </p>
        </div>
      </div>
    );
  }

  // No outer max-w/px wrapper here on purpose — every insertion point in this
  // codebase already sits inside a page-level `mx-auto max-w-* px-6`
  // container, so this only owns its card chrome and vertical rhythm
  // (via the caller-supplied `className`, e.g. "mt-28" to match neighboring
  // sections) rather than re-adding its own horizontal constraint.
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-dashed border-accent-2/50 bg-background-elevated/40 px-6 py-10 sm:px-10 ${className}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-16 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_22%,transparent),transparent_70%)] blur-3xl" />
      </div>
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-black text-black/80 shadow-[0_0_30px_color-mix(in_oklch,var(--color-accent-2)_35%,transparent)] ${BRAND_GRADIENT}`}
          >
            {brand.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <AdBadge label={label} />
            <p className="mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl">{headline}</p>
            {body && <p className="mt-1 text-sm text-foreground-muted">{body}</p>}
          </div>
        </div>
        <p
          className={`shrink-0 rounded-full px-6 py-3 text-sm font-semibold text-black/80 transition-[scale] [@media(hover:hover)]:hover:scale-105 ${BRAND_GRADIENT}`}
        >
          {ctaLabel} →
        </p>
      </div>
    </div>
  );
}
