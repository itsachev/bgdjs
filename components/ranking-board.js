"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CrownIcon, HeartIcon } from "@/components/icons";
import { useLenis } from "./smooth-scroll-provider";
import { AmbientGlow } from "./ambient-glow";
import { Kicker } from "./kicker";
import { AdSlot } from "./ad-slot";

gsap.registerPlugin(Flip);

const REST_PAGE_SIZE = 10;

const MEDAL_STYLES = {
  1: {
    order: "order-2",
    avatarSize: "h-24 w-24 sm:h-28 sm:w-28",
    ring: "ring-yellow-400",
    pedestal: "h-32 sm:h-40",
    numColor: "text-yellow-400",
    glow: "shadow-[0_0_50px_rgba(250,204,21,0.35)]",
  },
  2: {
    order: "order-1",
    avatarSize: "h-20 w-20 sm:h-24 sm:w-24",
    ring: "ring-slate-300",
    pedestal: "h-24 sm:h-28",
    numColor: "text-slate-300",
    glow: "",
  },
  3: {
    order: "order-3",
    avatarSize: "h-20 w-20 sm:h-24 sm:w-24",
    ring: "ring-amber-700",
    pedestal: "h-16 sm:h-20",
    numColor: "text-amber-700",
    glow: "",
  },
};

// Rolling-counter effect: tweens a plain number (not the DOM) and writes the
// rounded value into the span each frame, instead of hard-swapping the text.
function VoteCount({ value, className }) {
  const ref = useRef(null);
  const prev = useRef(value);

  useEffect(() => {
    const proxy = { val: prev.current };
    const tween = gsap.to(proxy, {
      val: value,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) ref.current.textContent = Math.round(proxy.val).toLocaleString();
      },
    });
    prev.current = value;
    return () => tween.kill();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString()}
    </span>
  );
}

function VoteButton({ hasVoted, disabled, onClick, label, votedLabel, size = "md" }) {
  function handleClick(e) {
    if (disabled) return;
    gsap
      .timeline()
      .to(e.currentTarget, { scale: 1.3, duration: 0.15, ease: "power2.out" })
      .to(e.currentTarget, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" });
    onClick();
  }

  const sizeClass = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const iconClass = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={hasVoted ? votedLabel : label}
      aria-pressed={hasVoted}
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        hasVoted
          ? "border-transparent bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] text-white"
          : "border-border text-foreground-muted hover:border-accent hover:text-accent"
      }`}
    >
      <HeartIcon filled={hasVoted} className={iconClass} />
    </button>
  );
}

function PodiumCard({ item, rank, href, dict, userId, onVote }) {
  const style = MEDAL_STYLES[rank];
  const isSelf = userId === item.id;

  return (
    <div className={`flex flex-1 flex-col items-center ${style.order}`}>
      <div className="relative">
        {rank === 1 && (
          <CrownIcon className="absolute -top-7 left-1/2 h-7 w-7 -translate-x-1/2 text-yellow-400" />
        )}
        <Link
          href={href}
          className={`relative block ${style.avatarSize} overflow-hidden rounded-full border-4 ${style.ring} bg-background-elevated ${style.glow}`}
        >
          {item.avatarUrl ? (
            <Image
              src={item.avatarUrl}
              alt={item.name}
              fill
              sizes="112px"
              className="object-cover"
              style={{ objectPosition: item.avatarPosition || "50% 50%" }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-xl font-semibold text-accent">
              {item.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </Link>
      </div>

      <Link
        href={href}
        className="mt-3 max-w-36 truncate text-center font-display font-semibold tracking-tight hover:text-accent"
      >
        {item.name}
      </Link>
      {item.meta && <p className="max-w-36 truncate text-center text-xs text-foreground-muted">{item.meta}</p>}

      <div className="mt-2 flex items-center gap-2">
        <VoteCount value={item.votes} className="font-display text-sm font-bold" />
        <VoteButton
          hasVoted={item.hasVoted}
          disabled={!userId || isSelf}
          onClick={() => onVote(item)}
          label={dict.vote}
          votedLabel={dict.voted}
        />
      </div>

      <div
        className={`mt-4 flex w-full items-end justify-center rounded-t-xl ${style.numColor} ${style.pedestal}`}
        style={{
          background: "linear-gradient(180deg, color-mix(in oklch, currentColor 25%, transparent), transparent)",
        }}
      >
        <span className="pb-2 font-display text-4xl font-black opacity-80 sm:text-5xl">{rank}</span>
      </div>
    </div>
  );
}

function RankRow({ item, rank, href, dict, userId, onVote }) {
  const isSelf = userId === item.id;

  return (
    <li data-rank-row className="flex items-center gap-4 bg-background px-4 py-3.5 sm:px-5">
      <span className="w-7 shrink-0 text-center font-mono text-sm text-foreground-muted">{rank}</span>
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-background-elevated">
          {item.avatarUrl ? (
            <Image
              src={item.avatarUrl}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              style={{ objectPosition: item.avatarPosition || "50% 50%" }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-accent">
              {item.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{item.name}</span>
          {item.meta && <span className="block truncate text-xs text-foreground-muted">{item.meta}</span>}
        </span>
      </Link>
      <VoteCount value={item.votes} className="w-10 shrink-0 text-right text-sm text-foreground-muted" />
      <VoteButton
        hasVoted={item.hasVoted}
        disabled={!userId || isSelf}
        onClick={() => onVote(item)}
        label={dict.vote}
        votedLabel={dict.voted}
      />
    </li>
  );
}

function RankingList({ items, type, locale, dict, userId, onVote }) {
  const mountRef = useRef(null);
  const listRef = useRef(null);
  const pendingFlip = useRef(null);
  const [page, setPage] = useState(1);
  const lenisRef = useLenis();

  const top3 = items.slice(0, 3);
  const rest = items.slice(3);
  const totalPages = Math.max(1, Math.ceil(rest.length / REST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * REST_PAGE_SIZE;
  const pageRest = rest.slice(pageStart, pageStart + REST_PAGE_SIZE);

  function goToPage(next) {
    setPage(next);
    const lenis = lenisRef?.current;
    if (lenis && listRef.current) {
      // -20 alone left the first row tucked under the sticky h-16 (64px)
      // header; clear it plus a little breathing room.
      lenis.scrollTo(listRef.current, { offset: -96 });
    } else if (listRef.current) {
      listRef.current.scrollIntoView({ block: "start" });
    }
  }

  // Switching tabs (dj/club) swaps in an unrelated list — start it back at
  // page 1 rather than carrying over an offset that may not even exist.
  useEffect(() => {
    setPage(1);
  }, [type]);

  useEffect(() => {
    if (pendingFlip.current) {
      Flip.from(pendingFlip.current, { duration: 0.7, ease: "expo.inOut", stagger: 0.03 });
      pendingFlip.current = null;
      return;
    }
    if (!mountRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-rank-row]",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: "power3.out" }
      );
    }, mountRef);
    return () => ctx.revert();

  }, [items, currentPage]);

  function handleVote(item) {
    if (listRef.current) {
      pendingFlip.current = Flip.getState(listRef.current.querySelectorAll("[data-rank-row]"));
    }
    onVote(item);
  }

  function hrefFor(item) {
    return type === "dj"
      ? `/${locale}/djs/${encodeURIComponent(item.displayName)}`
      : `/${locale}/clubs/${encodeURIComponent(item.displayName)}`;
  }

  if (items.length === 0) {
    return <p className="mt-10 text-center text-foreground-muted">{dict.empty}</p>;
  }

  return (
    <div ref={mountRef}>
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-3 px-2 sm:gap-6">
          {top3.map((item, i) => (
            <PodiumCard
              key={item.id}
              item={item}
              rank={i + 1}
              href={hrefFor(item)}
              dict={dict}
              userId={userId}
              onVote={handleVote}
            />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <ul
          ref={listRef}
          className="mt-10 flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border"
        >
          {pageRest.map((item, i) => (
            <RankRow
              key={item.id}
              item={item}
              rank={pageStart + i + 4}
              href={hrefFor(item)}
              dict={dict}
              userId={userId}
              onVote={handleVote}
            />
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 hover:border-accent hover:text-accent"
          >
            {dict.prev}
          </button>
          <p className="text-sm text-foreground-muted">
            {dict.page} {currentPage} / {totalPages}
          </p>
          <button
            type="button"
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 hover:border-accent hover:text-accent"
          >
            {dict.next}
          </button>
        </div>
      )}
    </div>
  );
}

function rankSort(a, b) {
  return b.votes - a.votes || a.tiebreak - b.tiebreak;
}

export function RankingBoard({ djs, clubs, locale, userId, dict, ad }) {
  const [tab, setTab] = useState("dj");
  const [djItems, setDjItems] = useState(djs);
  const [clubItems, setClubItems] = useState(clubs);

  async function handleVote(type, item) {
    if (!userId) return;
    const setItems = type === "dj" ? setDjItems : setClubItems;
    const wasVoted = item.hasVoted;

    setItems((current) =>
      current
        .map((it) =>
          it.id === item.id ? { ...it, votes: it.votes + (wasVoted ? -1 : 1), hasVoted: !wasVoted } : it
        )
        .sort(rankSort)
    );

    const supabase = createClient();
    if (wasVoted) {
      await supabase.from("profile_votes").delete().eq("voter_id", userId).eq("target_id", item.id);
    } else {
      await supabase.from("profile_votes").insert({ voter_id: userId, target_id: item.id });
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <AmbientGlow variant="directory" />

      <div className="relative mx-auto max-w-4xl px-6 py-16">
        <div className="flex justify-center">
          <Kicker>{dict.kicker}</Kicker>
        </div>
        <h1 className="mt-3 text-center font-display text-display-1 font-bold tracking-tight">{dict.title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-foreground-muted">{dict.subtitle}</p>

        <div className="mb-20 mt-10 flex justify-center gap-2">
          {["dj", "club"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full border px-6 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                tab === t
                  ? "border-transparent bg-accent text-white"
                  : "border-border text-foreground-muted hover:text-foreground"
              }`}
            >
              {t === "dj" ? dict.tabDjs : dict.tabClubs}
            </button>
          ))}
        </div>

        {!userId && (
          <p className="mt-6 text-center text-sm text-foreground-muted">
            <Link href={`/${locale}/login`} className="text-accent hover:text-accent-2">
              {dict.loginToVote}
            </Link>
          </p>
        )}

        {ad && (
          <AdSlot
            className="mt-10"
            label={ad.label}
            brand={ad.ranking.brand}
            headline={ad.ranking.headline}
            body={ad.ranking.body}
            ctaLabel={ad.cta}
          />
        )}

        <div className="mt-12">
          {tab === "dj" ? (
            <RankingList
              items={djItems}
              type="dj"
              locale={locale}
              dict={dict}
              userId={userId}
              onVote={(item) => handleVote("dj", item)}
            />
          ) : (
            <RankingList
              items={clubItems}
              type="club"
              locale={locale}
              dict={dict}
              userId={userId}
              onVote={(item) => handleVote("club", item)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
