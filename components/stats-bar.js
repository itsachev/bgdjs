"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function StatsBar({ stats }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      gsap.utils.toArray("[data-stat-value]").forEach((el) => {
        const target = Number(el.dataset.statValue);
        if (reduced) {
          el.textContent = target.toLocaleString();
          return;
        }
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(counter.value).toLocaleString();
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [stats]);

  return (
    <section ref={rootRef} className="border-y border-border bg-background-elevated/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
            <p className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              <span data-stat-value={stat.value}>0</span>
              {stat.suffix}
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
