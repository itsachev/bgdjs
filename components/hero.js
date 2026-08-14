"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Waveform } from "./waveform";

export function Hero({ dict, locale, hero }) {
  const rootRef = useRef(null);

  const title = hero?.[`title_${locale}`] || dict.hero.title;
  const mediaUrl = hero?.media_url;
  const mediaType = hero?.media_type;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from("[data-hero-eyebrow]", { opacity: 0, y: 16, duration: 0.6 })
        .from("[data-hero-title]", { opacity: 0, y: 24, duration: 0.8 }, "-=0.35")
        .from("[data-hero-subtitle]", { opacity: 0, y: 16, duration: 0.7 }, "-=0.5")
        .from("[data-hero-cta]", { opacity: 0, y: 16, duration: 0.6 }, "-=0.45")
        .from("[data-hero-waveform]", { opacity: 0, duration: 1 }, "-=0.4");
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      {/* -z-10 keeps this behind the (non-positioned) text below regardless of DOM order */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {mediaUrl ? (
          <>
            {mediaType === "video" ? (
              <video
                src={mediaUrl}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,color-mix(in_oklch,var(--color-accent)_22%,transparent),transparent_60%)]" />
        )}
      </div>

      <p data-hero-eyebrow className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-accent">
        {dict.hero.eyebrow}
      </p>
      <h1
        data-hero-title
        className="max-w-3xl text-balance bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-5xl font-bold tracking-tight text-transparent sm:text-6xl md:text-7xl"
      >
        {title}
      </h1>
      <p data-hero-subtitle className="mt-6 max-w-xl text-balance text-lg text-foreground-muted">
        {dict.hero.subtitle}
      </p>

      <a
        data-hero-cta
        href={`/${locale}/djs`}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        {dict.hero.cta}
      </a>

      <div data-hero-waveform className="mt-16 h-8 w-full max-w-2xl">
        <Waveform className="h-full w-full justify-center" />
      </div>
    </section>
  );
}
