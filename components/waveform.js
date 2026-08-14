"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const BAR_COUNT = 18;

export function Waveform({ className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const bars = containerRef.current?.querySelectorAll("[data-bar]");
    if (!bars?.length) return;

    const tweens = Array.from(bars).map((bar) =>
      gsap.to(bar, {
        scaleY: () => gsap.utils.random(0.2, 1),
        duration: () => gsap.utils.random(0.5, 1.3),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        transformOrigin: "center",
      })
    );

    return () => tweens.forEach((tween) => tween.kill());
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`flex items-center gap-[5px] ${className}`}
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          data-bar
          className="h-full w-[3px] rounded-full bg-gradient-to-t from-accent to-accent-2"
          style={{ scaleY: 0.4 }}
        />
      ))}
    </div>
  );
}
