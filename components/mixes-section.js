"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MixcloudIcon, SoundcloudIcon, YoutubeIcon, LinkIcon, PlayIcon, ChevronRightIcon } from "@/components/icons";
import { getMixEmbedSrc } from "@/lib/mix-embed";

const PLATFORM_ICONS = { mixcloud: MixcloudIcon, soundcloud: SoundcloudIcon, youtube: YoutubeIcon };
const PLATFORM_LABELS = { mixcloud: "Mixcloud", soundcloud: "SoundCloud", youtube: "YouTube" };

function MixRow({ mix, isOpen, onToggle }) {
  const wrapRef = useRef(null);
  const innerRef = useRef(null);
  const PlatformIcon = PLATFORM_ICONS[mix.platform] || LinkIcon;
  const embedSrc = getMixEmbedSrc(mix.url, mix.platform);

  // The iframe only mounts while open, so the height read here always
  // reflects the content that's actually about to be visible.
  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    const targetHeight = isOpen ? inner.getBoundingClientRect().height : 0;
    gsap.to(wrap, { height: targetHeight, duration: 0.5, ease: "power3.inOut" });
  }, [isOpen]);

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-background-elevated/40 transition-colors hover:border-accent/50">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-4 text-left">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
            isOpen
              ? "bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] text-white"
              : "bg-background text-accent"
          }`}
        >
          <PlayIcon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">{mix.title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground-muted">
            <PlatformIcon className="h-3 w-3" /> {PLATFORM_LABELS[mix.platform] || mix.platform}
          </span>
        </span>
        <ChevronRightIcon
          className={`h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      <div ref={wrapRef} style={{ height: 0 }} className="overflow-hidden">
        <div ref={innerRef} className="px-5 pb-5">
          {isOpen && embedSrc && (
            <iframe
              key={mix.id}
              src={embedSrc}
              title={mix.title}
              className="h-32 w-full rounded-lg border-0"
              allow="autoplay"
              loading="lazy"
            />
          )}
        </div>
      </div>
    </li>
  );
}

export function MixesSection({ mixes, title }) {
  const [openId, setOpenId] = useState(null);

  if (!mixes || mixes.length === 0) return null;

  return (
    <div>
      {title && <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{title}</p>}
      <ul className="flex flex-col gap-3">
        {mixes.map((mix) => (
          <MixRow
            key={mix.id}
            mix={mix}
            isOpen={openId === mix.id}
            onToggle={() => setOpenId((current) => (current === mix.id ? null : mix.id))}
          />
        ))}
      </ul>
    </div>
  );
}
