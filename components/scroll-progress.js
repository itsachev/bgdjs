"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(barRef.current, { scaleX: 0 });
      ScrollTrigger.create({
        start: 0,
        end: () => document.documentElement.scrollHeight - window.innerHeight,
        // Guarded: a scroll event can still land between unmount and this
        // trigger's cleanup (route change, Fast Refresh), by which point the
        // ref has already gone null.
        onUpdate: (self) => {
          if (barRef.current) gsap.set(barRef.current, { scaleX: self.progress });
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="absolute inset-x-0 bottom-0 h-px bg-border/80" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full origin-left bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))]"
      />
    </div>
  );
}
