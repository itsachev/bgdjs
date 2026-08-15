"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { SpeakerOnIcon, SpeakerOffIcon } from "@/components/icons";

// Duplicates the content once; the track is exactly two copies wide, so animating it to
// xPercent:-50 and repeating shifts by precisely one copy-width each loop — the trailing
// clone lands exactly where the first copy started, giving a seamless infinite scroll.
function MarqueeText({ children, measureKey, playing }) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const copyRef = useRef(null);
  const tweenRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    function measure() {
      if (!containerRef.current || !copyRef.current) return;
      setOverflowing(copyRef.current.offsetWidth > containerRef.current.clientWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measureKey]);

  useEffect(() => {
    if (!overflowing) return;

    const ctx = gsap.context(() => {
      const duration = Math.max(6, copyRef.current.offsetWidth / 25);
      tweenRef.current = gsap.to(trackRef.current, {
        xPercent: -50,
        duration,
        ease: "none",
        repeat: -1,
        paused: !playing,
      });
    }, containerRef);

    return () => {
      tweenRef.current = null;
      ctx.revert();
    };
  }, [overflowing, measureKey]);

  useEffect(() => {
    if (!tweenRef.current) return;
    if (playing) tweenRef.current.play();
    else tweenRef.current.pause();
  }, [playing]);

  return (
    <div ref={containerRef} className="w-40 overflow-hidden whitespace-nowrap">
      <div ref={trackRef} className="flex w-max">
        <span ref={copyRef} className="inline-block pr-12">
          {children}
        </span>
        {overflowing && (
          <span className="inline-block pr-12" aria-hidden="true">
            {children}
          </span>
        )}
      </div>
    </div>
  );
}

export function SiteAudioPlayer({ title, authorInfo, mediaUrl }) {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    audioRef.current?.play().catch(() => {
      // Autoplay can still be blocked by some browsers even when muted —
      // the toggle button remains the fallback to start playback.
    });
  }, []);

  function toggleMuted() {
    const audio = audioRef.current;
    if (!audio) return;

    const next = !muted;
    audio.muted = next;
    setMuted(next);
    if (!next) audio.play().catch(() => {});
  }

  if (!mediaUrl) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-1.5">
      <p className="pr-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Track of the day
      </p>
      <div className="flex items-center gap-2 rounded-full border border-border bg-background-elevated/90 py-2 pl-2 pr-4 shadow-lg backdrop-blur-md">
        <audio ref={audioRef} src={mediaUrl} loop muted autoPlay />
        <button
          type="button"
          onClick={toggleMuted}
          aria-label={muted ? "Unmute site audio" : "Mute site audio"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-90"
        >
          {muted ? <SpeakerOffIcon className="h-4 w-4" /> : <SpeakerOnIcon className="h-4 w-4" />}
        </button>
        {title && (
          <div className="flex min-w-0 items-center">
            <MarqueeText measureKey={`${title}|${authorInfo ?? ""}`} playing={!muted}>
              <span className="text-sm font-medium">{title}</span>
              {authorInfo && <span className="text-sm text-foreground-muted"> — {authorInfo}</span>}
            </MarqueeText>
          </div>
        )}
      </div>
    </div>
  );
}
