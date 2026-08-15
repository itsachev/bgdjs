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
      gsap.set(rootRef.current, { scale: 1.3 });
      gsap.to(rootRef.current, {
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
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 right-0 -z-10 hidden h-screen w-1/2 md:block"
    >
      {/* Opacity + left mask live on this inner layer only, so the bottom-fade
          overlay below isn't dimmed along with the photo and can reach a fully
          opaque match with the page background instead of a faint 30% tint. */}
      <div className="absolute inset-0 opacity-30 mask-[linear-gradient(to_left,black_40%,transparent)]">
        <Image
          src={src}
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          style={{ objectPosition: position || "50% 50%" }}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-background to-transparent" />
    </div>
  );
}
