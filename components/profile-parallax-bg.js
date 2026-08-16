"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

export function ProfileParallaxBg({ src, position, align = "right" }) {
  const rootRef = useRef(null);
  const sideClass = align === "left" ? "left-0" : "right-0";
  // The edge mask always fades toward the content column in the center of
  // the page, so it has to point the opposite way from whichever side the
  // panel itself sits on.
  const edgeMaskClass =
    align === "left"
      ? "mask-[linear-gradient(to_right,black_40%,transparent)]"
      : "mask-[linear-gradient(to_left,black_40%,transparent)]";

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
      className={`pointer-events-none absolute top-0 -z-10 hidden h-screen w-1/2 md:block ${sideClass}`}
    >
      <div className={`absolute inset-0 opacity-30 ${edgeMaskClass}`}>
        <Image
          src={src}
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          style={{ objectPosition: position || "50% 50%" }}
        />
      </div>
    </div>
  );
}
