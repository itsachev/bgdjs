"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

// Same drifting-blob ambience used as a static background on the listing/profile
// pages, but scroll-linked here — each orb moves at its own rate as the section
// passes through the viewport, giving the section depth without needing a photo.
// When a CMS `media` background is set, that drifts instead (same bleed-then-drift
// trick as the hero), and the orbs are skipped so the two don't compete. The
// background always spans the full viewport width — only `children` gets
// constrained by `className` — so an uploaded photo/video bleeds edge to edge
// instead of being boxed in by the section's own max-width.
export function ParallaxSection({ children, className = "", media }) {
  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const blobARef = useRef(null);
  const blobBRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (media?.url) {
        gsap.set(bgRef.current, { scale: 1.3 });
        gsap.to(bgRef.current, {
          yPercent: 30,
          ease: "none",
          scrollTrigger: { trigger: rootRef.current, start: "top bottom", end: "bottom top", scrub: true },
        });
      } else {
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
      }
    }, rootRef);

    return () => ctx.revert();
  }, [media?.url]);

  return (
    <section ref={rootRef} className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {media?.url ? (
          <div ref={bgRef} className="absolute inset-0">
            {media.type === "video" ? (
              <video src={media.url} className="h-full w-full object-cover" autoPlay muted loop playsInline />
            ) : (
              <Image src={media.url} alt="" fill sizes="100vw" className="object-cover" />
            )}
            <div className="absolute inset-0 bg-linear-to-b from-background/50 via-background/85 to-background" />
          </div>
        ) : (
          <>
            <div
              ref={blobARef}
              className="absolute -top-24 left-[8%] h-80 w-80 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_28%,transparent),transparent_70%)] blur-3xl"
            />
            <div
              ref={blobBRef}
              className="absolute -bottom-24 right-[10%] h-96 w-96 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_24%,transparent),transparent_70%)] blur-3xl"
            />
          </>
        )}
      </div>
      <div className={className}>{children}</div>
    </section>
  );
}
