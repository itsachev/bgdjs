"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function Marquee({ items, className = "", speed = 60 }) {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The track renders the item list twice back to back; looping the tween
    // exactly across one copy's width makes the seam invisible.
    const loopWidth = track.scrollWidth / 2;
    const tween = gsap.to(track, {
      x: -loopWidth,
      duration: loopWidth / speed,
      ease: "none",
      repeat: -1,
    });

    return () => tween.kill();
  }, [items, speed]);

  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <div ref={trackRef} className="flex w-max shrink-0 items-center gap-10 whitespace-nowrap will-change-transform">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-10 text-sm font-semibold uppercase tracking-[0.25em] text-foreground-muted">
            {item}
            <span className="text-accent">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
