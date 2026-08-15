"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const TALL = 68;
const SHORT = 54;

export function HeaderShrink({ children }) {
  const rootRef = useRef(null);
  const shrunk = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(rootRef.current, { height: window.scrollY > 40 ? SHORT : TALL });
    }

    function onScroll() {
      if (!rootRef.current) return;
      const isShrunk = window.scrollY > 40;
      if (isShrunk === shrunk.current) return;
      shrunk.current = isShrunk;
      gsap.to(rootRef.current, {
        height: isShrunk ? SHORT : TALL,
        duration: 0.35,
        ease: "power2.out",
        overwrite: true,
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={rootRef} style={{ height: TALL }} className="mx-auto flex max-w-7xl items-center justify-between px-6">
      {children}
    </div>
  );
}
