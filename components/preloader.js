"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const SESSION_KEY = "bgdj-preloaded";
const WORDMARK = "BGDJ.";

export function Preloader() {
  const rootRef = useRef(null);
  const barRef = useRef(null);
  const counterRef = useRef(null);
  // Stays mounted until the intro (or the skip-path below) decides otherwise —
  // starting true keeps the very first paint (server-rendered) covered so
  // there's no flash of page content before this effect can even run.
  const [mounted, setMounted] = useState(true);

  useLayoutEffect(() => {
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sessionStorage.setItem(SESSION_KEY, "1");

    if (alreadyShown || reduced) {
      setMounted(false);
      return;
    }

    document.body.style.overflow = "hidden";
    const progress = { value: 0 };

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          defaults: { ease: "power4.out" },
          onComplete: () => {
            document.body.style.overflow = "";
            setMounted(false);
          },
        })
        .to("[data-char]", { yPercent: 0, duration: 0.9, stagger: 0.035 })
        .to(
          progress,
          {
            value: 100,
            duration: 1.2,
            ease: "power1.inOut",
            onUpdate: () => {
              if (counterRef.current) counterRef.current.textContent = `${Math.round(progress.value)}%`;
              if (barRef.current) gsap.set(barRef.current, { scaleX: progress.value / 100 });
            },
          },
          "<"
        )
        .to("[data-char]", { yPercent: -110, duration: 0.5, ease: "power3.in", stagger: 0.02 }, "+=0.2")
        .to(rootRef.current, { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, "-=0.3");
    }, rootRef);

    return () => ctx.revert();
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-[#07060a]"
    >
      <div className="flex">
        {WORDMARK.split("").map((ch, i) => (
          <span key={i} className="overflow-hidden">
            <span
              data-char
              className="inline-block transform-[translateY(110%)] font-display text-5xl font-bold tracking-tight text-white sm:text-7xl"
            >
              {ch === "." ? <span className="text-accent-2">.</span> : ch}
            </span>
          </span>
        ))}
      </div>

      <div className="mt-8 h-px w-40 overflow-hidden bg-white/15">
        <div
          ref={barRef}
          className="h-full w-full origin-left transform-[scaleX(0)] bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))]"
        />
      </div>
      <div ref={counterRef} className="mt-3 text-xs font-medium tracking-[0.2em] text-white/40">
        0%
      </div>
    </div>
  );
}
