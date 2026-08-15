"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export function CtaBanner({ kicker, title, subtitle, buttonLabel, href }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      // toggleActions replays the reveal every time the section crosses into
      // view (from either direction) and reverses it every time it leaves,
      // instead of only firing once or tracking exact scroll position.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play reverse play reverse",
          },
          defaults: { ease: "power3.out" },
        })
        .to("[data-cta-kicker]", { opacity: 1, y: 0, duration: 0.5 })
        .to("[data-cta-title]", { opacity: 1, y: 0, duration: 0.7 }, "-=0.3")
        .to("[data-cta-subtitle]", { opacity: 1, y: 0, duration: 0.6 }, "-=0.45")
        .to("[data-cta-button]", { opacity: 1, y: 0, duration: 0.5 }, "-=0.4");
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="mx-auto max-w-[100rem] px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-background-elevated/40 px-6 py-16 text-center sm:px-12 sm:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-144 w-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_22%,transparent),transparent_70%)] blur-3xl" />
        </div>

        <p
          data-cta-kicker
          className="mx-auto flex w-fit transform-[translateY(16px)] items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-accent opacity-0"
        >
          <span className="h-px w-6 bg-current" aria-hidden="true" />
          {kicker}
          <span className="h-px w-6 bg-current" aria-hidden="true" />
        </p>
        <h2
          data-cta-title
          className="mx-auto mt-4 max-w-4xl transform-[translateY(24px)] text-balance bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-display-2 font-bold tracking-tight text-transparent opacity-0"
        >
          {title}
        </h2>
        <p data-cta-subtitle className="mx-auto mt-5 max-w-md transform-[translateY(16px)] text-foreground-muted opacity-0">
          {subtitle}
        </p>
        <Link
          data-cta-button
          href={href}
          className="mt-10 inline-flex transform-[translateY(16px)] items-center gap-2 rounded-full bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] px-8 py-3.5 text-sm font-semibold text-white opacity-0 shadow-[0_0_40px_color-mix(in_oklch,var(--color-accent)_35%,transparent)] transition-[scale] hover:scale-105"
        >
          {buttonLabel}
        </Link>
      </div>
    </section>
  );
}
