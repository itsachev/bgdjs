"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Same drifting-blob ambience used as a static background on the listing/profile
// pages, but scroll-linked here — each orb moves at its own rate as the section
// passes through the viewport, giving the section depth without needing a photo.
export function ParallaxSection({ children, className = "" }) {
  const rootRef = useRef(null);
  const blobARef = useRef(null);
  const blobBRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(blobARef.current, {
        yPercent: 35,
        ease: "none",
        scrollTrigger: { trigger: rootRef.current, start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.to(blobBRef.current, {
        yPercent: -25,
        ease: "none",
        scrollTrigger: { trigger: rootRef.current, start: "top bottom", end: "bottom top", scrub: true },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className={`relative overflow-hidden ${className}`}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          ref={blobARef}
          className="absolute -top-24 left-[8%] h-80 w-80 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_28%,transparent),transparent_70%)] blur-3xl"
        />
        <div
          ref={blobBRef}
          className="absolute -bottom-24 right-[10%] h-96 w-96 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_24%,transparent),transparent_70%)] blur-3xl"
        />
      </div>
      {children}
    </section>
  );
}
