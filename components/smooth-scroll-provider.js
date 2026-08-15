"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const LenisContext = createContext(null);

// Returns a ref (not the instance directly) since Lenis is created inside an
// effect, after the first render — consumers read `.current` when they
// actually need it, rather than re-rendering once it becomes available.
export function useLenis() {
  return useContext(LenisContext);
}

export function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Collapsing/expanding content (an accordion, a "show more" list, a
    // reviews panel) changes the page height without a window resize, so
    // Lenis's scroll bounds and ScrollTrigger's cached trigger positions
    // would otherwise go stale — sections below the change (e.g. "Get in
    // touch") would then reveal at the wrong scroll offset. Debounced since
    // a single GSAP height-animation fires many resize notifications while
    // it's mid-transition.
    let resizeTimeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      }, 150);
    });
    resizeObserver.observe(document.body);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}
