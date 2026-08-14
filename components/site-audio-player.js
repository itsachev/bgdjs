"use client";

import { useEffect, useRef, useState } from "react";
import { SpeakerOnIcon, SpeakerOffIcon } from "@/components/icons";

export function SiteAudioPlayer({ title, mediaUrl }) {
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
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-border bg-background-elevated/90 py-2 pl-2 pr-4 shadow-lg backdrop-blur-md">
      <audio ref={audioRef} src={mediaUrl} loop muted autoPlay />
      <button
        type="button"
        onClick={toggleMuted}
        aria-label={muted ? "Unmute site audio" : "Mute site audio"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-90"
      >
        {muted ? <SpeakerOffIcon className="h-4 w-4" /> : <SpeakerOnIcon className="h-4 w-4" />}
      </button>
      {title && <p className="max-w-40 truncate text-sm font-medium">{title}</p>}
    </div>
  );
}
