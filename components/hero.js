"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Waveform } from "./waveform";

gsap.registerPlugin(ScrollTrigger);

export function Hero({ dict, locale, hero }) {
  const rootRef = useRef(null);

  const title = hero?.[`title_${locale}`] || dict.hero.title;
  const mediaUrl = hero?.media_url;
  const mediaType = hero?.media_type;

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Elements start hidden via CSS (not gsap.from) so they never flash at full
      // opacity between server-rendered paint and this effect running.
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .to("[data-hero-title]", { opacity: 1, y: 0, duration: 0.8 })
        .to("[data-hero-subtitle]", { opacity: 1, y: 0, duration: 0.7 }, "-=0.5")
        .to("[data-hero-cta]", { opacity: 1, y: 0, duration: 0.6 }, "-=0.45")
        .to("[data-hero-waveform]", { opacity: 1, duration: 1 }, "-=0.4");

      // Background drifts slower than the scroll (classic parallax); the
      // 1.3 scale gives it enough bleed that the shift never exposes an edge.
      gsap.set("[data-hero-bg]", { scale: 1.3 });
      gsap.to("[data-hero-bg]", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      {/* -z-10 keeps this behind the (non-positioned) text below regardless of DOM order */}
      <div data-hero-bg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
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
              <Image src={mediaUrl} alt="" fill sizes="100vw" preload className="object-cover" />
            )}
            {/* Fixed dark scrim regardless of site theme — a light-theme fade here would wash the photo out to white. */}
            <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/90 to-[#07060a]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,color-mix(in_oklch,var(--color-accent)_22%,transparent),transparent_60%)]" />
        )}
      </div>

      {/* <p data-hero-eyebrow className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-accent">
        {dict.hero.eyebrow}
      </p> */}
      {/* Fixed dark-theme gradient stops regardless of site theme — against a
          photo background, a light-theme dark start color went unreadable. */}
      <h1
        data-hero-title
        className="transform-[translateY(24px)] text-balance bg-[linear-gradient(to_right,#f4f2fb,#a855f7_60%,#22ffd1)] bg-clip-text font-display text-4xl font-bold tracking-tight text-transparent opacity-0 sm:text-5xl md:text-6xl xl:text-7xl"
      >
        {title}
      </h1>
      <p data-hero-subtitle className="mt-6 max-w-xl transform-[translateY(16px)] text-balance text-lg text-foreground-muted opacity-0">
        {dict.hero.subtitle}
      </p>

      <a
        data-hero-cta
        href={`/${locale}/djs`}
        className="mt-10 inline-flex transform-[translateY(16px)] items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-white opacity-0 transition-transform hover:scale-105"
      >
        {dict.hero.cta}
      </a>

      <div data-hero-waveform className="mt-16 h-5 w-full max-w-2xl opacity-0">
        <Waveform className="h-full w-full justify-center" />
      </div>
    </section>
  );
}
