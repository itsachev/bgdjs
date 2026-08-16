"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MapPinIcon, CrownIcon, HeartIcon } from "@/components/icons";
import { AdSlot } from "@/components/ad-slot";

// Where in the results grid the in-feed sponsored card is inserted (0-based,
// after this many real DJ cards) — mirrors a typical in-feed native ad slot.
const AD_CARD_POSITION = 7;

gsap.registerPlugin(ScrollTrigger);

// Matches the presence heartbeat interval (60s) with buffer for network lag.
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

function isOnline(lastSeenAt) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

const MEDAL = {
  1: { ring: "ring-yellow-400", badge: "bg-yellow-400 text-black", avatar: "h-24 w-24 sm:h-28 sm:w-28" },
  2: { ring: "ring-slate-300", badge: "bg-slate-300 text-black", avatar: "h-18 w-18 sm:h-20 sm:w-20" },
  3: { ring: "ring-amber-700", badge: "bg-amber-600 text-white", avatar: "h-18 w-18 sm:h-20 sm:w-20" },
};
const REST_MEDAL = { ring: "ring-border", badge: "bg-background-elevated text-foreground-muted", avatar: "h-16 w-16" };

// Reveals a section's header + cards on scroll and reverses on the way out,
// every time — elements start hidden via CSS (not gsap.from) so they never
// flash at full opacity between server-rendered paint and this effect
// running, and so "reverse" always has a well-defined state to return to.
function useSectionReveal(ref, deps) {
  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const headers = ref.current.querySelectorAll("[data-reveal-header]");
    const cards = ref.current.querySelectorAll("[data-reveal-card]");
    if (headers.length === 0 && cards.length === 0) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: "top 88%",
          end: "bottom 15%",
          toggleActions: "play reverse play reverse",
        },
        defaults: { ease: "power2.out" },
      });
      // Some sections (the results grid) only have cards, no header — only
      // queue a tween for a target set that actually exists, since gsap
      // warns on an empty NodeList.
      if (headers.length > 0) tl.to(headers, { opacity: 1, y: 0, duration: 0.5 });
      if (cards.length > 0) tl.to(cards, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 }, "-=0.25");
    }, ref);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function GenreLeaderboard({ title, djs, locale, votesLabel }) {
  const rootRef = useRef(null);
  useSectionReveal(rootRef, [djs]);

  if (djs.length === 0) return null;

  return (
    <div ref={rootRef} className="my-20">
      <h2
        data-reveal-header
        className="transform-[translateY(20px)] font-display text-display-3 font-bold tracking-tight opacity-0"
      >
        {title}
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {djs.map(({ id, display_name, avatar_url, avatar_position, dj, votes }, i) => {
          const name = dj?.stage_name || display_name;
          const rank = i + 1;
          const medal = MEDAL[rank] || REST_MEDAL;
          return (
            <Link
              key={id}
              data-reveal-card
              href={`/${locale}/djs/${encodeURIComponent(display_name)}`}
              className="group flex transform-[translateY(28px)] flex-col items-center gap-3 rounded-2xl border border-border bg-background-elevated p-5 text-center opacity-0 transition-colors hover:border-accent"
            >
              <div className="relative">
                <div className={`relative shrink-0 overflow-hidden rounded-full ring-2 ${medal.ring} ${medal.avatar}`}>
                  {avatar_url ? (
                    <Image
                      src={avatar_url}
                      alt={name}
                      fill
                      sizes="112px"
                      className="object-cover"
                      style={{ objectPosition: avatar_position || "50% 50%" }}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-background font-display text-lg font-semibold text-accent">
                      {name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${medal.badge}`}
                >
                  {rank === 1 ? <CrownIcon className="h-3 w-3" /> : rank}
                </span>
              </div>
              <p className="truncate text-sm font-semibold tracking-tight transition-colors group-hover:text-accent">
                {name}
              </p>
              <p className="flex items-center gap-1 text-xs text-foreground-muted">
                <HeartIcon className="h-3.5 w-3.5" /> {votes} {votesLabel}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DjCard({ display_name, avatar_url, avatar_position, last_seen_at, dj, locale, onlineLabel }) {
  const name = dj?.stage_name || display_name;
  const online = isOnline(last_seen_at);
  const genres = dj?.sound_profile
    ? dj.sound_profile.split(",").map((g) => g.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <Link
      data-reveal-card
      href={`/${locale}/djs/${encodeURIComponent(display_name)}`}
      className="group relative flex aspect-3/4 transform-[translateY(32px)] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-background-elevated opacity-0 transition-[translate,border-color] duration-500 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-accent/60"
    >
      <div className="absolute inset-0" aria-hidden="true">
        {avatar_url ? (
          <Image
            src={avatar_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 24vw, (min-width: 640px) 32vw, 48vw"
            className="object-cover transition-transform duration-700 [@media(hover:hover)]:group-hover:scale-105"
            style={{ objectPosition: avatar_position || "50% 50%" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_oklch,var(--color-accent)_22%,var(--color-background-elevated)),color-mix(in_oklch,var(--color-accent-2)_22%,var(--color-background-elevated)))] font-display text-3xl font-semibold text-white/70">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
        {/* Fixed dark scrim regardless of site theme — the caption below is always white. */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/25 to-transparent" />
      </div>

      {online && (
        <span className="group/status absolute right-3 top-3">
          <span className="block h-2.5 w-2.5 rounded-full border-2 border-black/40 bg-green-500" />
          <span className="pointer-events-none absolute right-0 top-full mt-1.5 whitespace-nowrap rounded-md bg-background-elevated px-2 py-1 text-xs font-medium text-foreground opacity-0 shadow-lg ring-1 ring-border transition-opacity duration-150 group-hover/status:opacity-100">
            {onlineLabel}
          </span>
        </span>
      )}

      <div className="relative flex flex-col gap-1.5 p-4">
        <p className="font-display font-semibold tracking-tight text-white">{name}</p>
        {dj?.location && (
          <p className="flex items-center gap-1 text-xs text-white/70">
            <MapPinIcon className="h-3 w-3" /> {dj.location}
          </p>
        )}
        {genres.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <span key={g} className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function DjDirectory({
  topHouseDjs,
  topHouseTitle,
  topHouseVotesLabel,
  topPopFolkDjs,
  topPopFolkTitle,
  topPopFolkVotesLabel,
  pageDjs,
  locale,
  onlineLabel,
  emptyMessage,
  ad,
}) {
  const gridRef = useRef(null);
  useSectionReveal(gridRef, [pageDjs]);

  const cards = pageDjs.flatMap((profile, i) => {
    const items = [<DjCard key={profile.id} {...profile} locale={locale} onlineLabel={onlineLabel} />];
    if (ad && i === AD_CARD_POSITION) {
      items.push(
        <div
          key="sponsored-slot"
          data-reveal-card
          className="transform-[translateY(32px)] opacity-0"
        >
          <AdSlot
            variant="card"
            label={ad.sponsoredLabel}
            brand={ad.djsCard.brand}
            headline={ad.djsCard.headline}
            ctaLabel={ad.cta}
          />
        </div>
      );
    }
    return items;
  });

  return (
    <>
      <GenreLeaderboard title={topHouseTitle} djs={topHouseDjs} locale={locale} votesLabel={topHouseVotesLabel} />
      <GenreLeaderboard title={topPopFolkTitle} djs={topPopFolkDjs} locale={locale} votesLabel={topPopFolkVotesLabel} />

      {pageDjs.length === 0 ? (
        <p className="mt-16 text-foreground-muted">{emptyMessage}</p>
      ) : (
        <div ref={gridRef} className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cards}
        </div>
      )}
    </>
  );
}
