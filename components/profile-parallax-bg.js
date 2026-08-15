"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

export function ProfileParallaxBg({ src, position }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Same trick as the homepage hero: scale up for bleed room, then drift the
      // background slower than the page scroll so it never exposes an edge.
      gsap.set(rootRef.current, { scale: 1.15 });
      gsap.to(rootRef.current, {
        yPercent: 15,
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
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 opacity-30 mask-[linear-gradient(to_left,black_40%,transparent)] md:block"
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="50vw"
        className="object-cover"
        style={{ objectPosition: position || "50% 50%" }}
      />
    </div>
  );
}
