"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeartIcon } from "@/components/icons";
import { Kicker } from "@/components/kicker";

gsap.registerPlugin(ScrollTrigger);

// Bento-style spotlight grid: one large card plus up to four smaller ones,
// replacing the old empty PlaceholderGrid on the homepage with real,
// vote-ranked DJs/clubs.
export function FeaturedEntities({ kicker, title, viewAllHref, viewAllLabel, items, locale, basePath, votesLabel }) {
  const rootRef = useRef(null);
  const hasItems = items && items.length > 0;

  useEffect(() => {
    if (!hasItems) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // toggleActions replays the reveal every time the section crosses into
    // view (from either direction) and reverses it every time it leaves,
    // instead of only firing once or tracking exact scroll position. Elements
    // start hidden via CSS (not gsap.from) so they never flash at full
    // opacity between server-rendered paint and this effect running, and so
    // "reverse" has a well-defined state to animate back to.
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 85%",
            end: "bottom 35%",
            scrub: true,
          },
          defaults: { ease: "power2.out" },
        })
        .to("[data-featured-header]", { opacity: 1, y: 0, duration: 0.5 })
        .to("[data-featured-card]", { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, "-=0.25");
    }, rootRef);

    return () => ctx.revert();
  }, [hasItems]);

  if (!hasItems) return null;

  const [spotlight, ...rest] = items;

  return (
    <section ref={rootRef} className="mx-auto max-w-7xl px-6 py-24">
      <div
        data-featured-header
        className="mb-10 flex transform-[translateY(24px)] flex-wrap items-end justify-between gap-4 opacity-0"
      >
        <div>
          <Kicker>{kicker}</Kicker>
          <h2 className="mt-3 font-display text-display-2 font-bold tracking-tight">{title}</h2>
        </div>
        <Link href={viewAllHref} className="text-sm font-semibold text-accent transition-colors hover:text-accent-2">
          {viewAllLabel} →
        </Link>
      </div>

      <div className="grid auto-rows-32 grid-cols-2 gap-4 sm:auto-rows-38 sm:grid-cols-4">
        <EntityCard
          entity={spotlight}
          locale={locale}
          basePath={basePath}
          votesLabel={votesLabel}
          large
          className="col-span-2 row-span-2"
        />
        {rest.slice(0, 4).map((entity) => (
          <EntityCard key={entity.id} entity={entity} locale={locale} basePath={basePath} votesLabel={votesLabel} />
        ))}
      </div>
    </section>
  );
}

function EntityCard({ entity, locale, basePath, votesLabel, large = false, className = "" }) {
  return (
    <Link
      data-featured-card
      href={`/${locale}/${basePath}/${encodeURIComponent(entity.displayName)}`}
      className={`group relative flex transform-[translateY(40px)] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-background-elevated opacity-0 transition-[translate,border-color] duration-500 [@media(hover:hover)]:hover:-translate-y-1 ${className}`}
    >
      <div className="absolute inset-0" aria-hidden="true">
        {entity.avatarUrl ? (
          <Image
            src={entity.avatarUrl}
            alt=""
            fill
            sizes={large ? "(min-width: 640px) 45vw, 90vw" : "(min-width: 640px) 22vw, 45vw"}
            className="object-cover transition-transform duration-700 [@media(hover:hover)]:group-hover:scale-105"
            style={{ objectPosition: entity.avatarPosition || "50% 50%" }}
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,color-mix(in_oklch,var(--color-accent)_22%,var(--color-background-elevated)),color-mix(in_oklch,var(--color-accent-2)_22%,var(--color-background-elevated)))]" />
        )}
        {/* Fixed dark scrim regardless of site theme — the caption text below is always white. */}
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />
      </div>

      <div className="relative p-4">
        <p className={`font-display font-semibold tracking-tight text-white ${large ? "text-2xl" : "text-sm"}`}>
          {entity.name}
        </p>
        {entity.meta && <p className="mt-0.5 truncate text-xs text-white/70">{entity.meta}</p>}
        {typeof entity.votes === "number" && entity.votes > 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs text-white/70">
            <HeartIcon className="h-3 w-3" /> {entity.votes} {votesLabel}
          </p>
        )}
      </div>
    </Link>
  );
}
