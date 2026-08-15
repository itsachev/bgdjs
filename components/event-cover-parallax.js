"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

export function EventCoverParallax({ src }) {
  const rootRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Same bleed-then-drift trick as the homepage hero and profile
      // backgrounds, just scoped to this in-flow banner's own scroll range.
      gsap.set(imgRef.current, { scale: 1.15 });
      gsap.to(imgRef.current, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-background-elevated"
    >
      <div ref={imgRef} className="absolute inset-0">
        <Image src={src} alt="" fill sizes="896px" priority className="object-cover" />
      </div>
    </div>
  );
}
