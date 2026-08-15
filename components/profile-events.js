"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { createClient } from "@/lib/supabase/client";
import { CalendarIcon, CloseIcon, PlusIcon } from "@/components/icons";

function formatCompactDate(isoString, locale) {
  const date = new Date(isoString);
  const intlLocale = locale === "bg" ? "bg-BG" : "en-GB";
  return {
    day: new Intl.DateTimeFormat(intlLocale, { day: "numeric" }).format(date),
    month: new Intl.DateTimeFormat(intlLocale, { month: "short" }).format(date).replace(".", ""),
    time: new Intl.DateTimeFormat(intlLocale, { hour: "2-digit", minute: "2-digit" }).format(date),
  };
}

export function ProfileEvents({
  events: initialEvents,
  locale,
  title,
  isOwner,
  removeLabel,
  confirmLabel,
  createEventHref,
  createEventLabel,
}) {
  const [events, setEvents] = useState(initialEvents || []);
  const [confirmingId, setConfirmingId] = useState(null);
  const listRef = useRef(null);
  const confirmTimeout = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-event-row]",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" }
      );
    }, listRef);
    return () => ctx.revert();
    // Deliberately empty — this is a one-shot mount animation, not something
    // that should replay when `events` shrinks after a delete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimeout(confirmTimeout.current), []);

  if (events.length === 0) return null;

  // First click arms the button (red, asks to confirm) instead of deleting
  // straight away; a second click within the window actually removes it.
  function handleDeleteClick(id, e) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      gsap.fromTo(e.currentTarget, { scale: 1.15 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
      clearTimeout(confirmTimeout.current);
      confirmTimeout.current = setTimeout(() => setConfirmingId(null), 3000);
      return;
    }
    clearTimeout(confirmTimeout.current);
    setConfirmingId(null);
    handleRemove(id);
  }

  async function handleRemove(id) {
    setEvents((current) => current.filter((e) => e.id !== id));
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
  }

  return (
    <div>
      {(title || (isOwner && createEventHref)) && (
        <div className="mb-3 flex items-center gap-3">
          {title && <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{title}</p>}
          {isOwner && createEventHref && (
            <Link
              href={createEventHref}
              className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-accent-2"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {createEventLabel}
            </Link>
          )}
        </div>
      )}
      <ul ref={listRef} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const { day, month, time } = formatCompactDate(event.starts_at, locale);
          return (
            <li
              key={event.id}
              data-event-row
              className="group flex items-center gap-4 rounded-xl border border-border bg-background-elevated/40 pr-3 transition-colors hover:border-accent/50"
            >
              <Link href={`/${locale}/events/${event.id}`} className="flex min-w-0 flex-1 items-center gap-4 py-3 pl-4">
                <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] leading-none text-white">
                  <span className="font-display text-sm font-bold">{day}</span>
                  <span className="text-[0.6rem] font-semibold uppercase tracking-wide">{month}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground transition-colors group-hover:text-accent">
                    {event.title}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-foreground-muted">
                    <CalendarIcon className="h-3 w-3" /> {time}
                  </span>
                </span>
              </Link>
              {isOwner && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(event.id, e)}
                  aria-label={confirmingId === event.id ? confirmLabel : removeLabel}
                  className={`shrink-0 rounded-full p-1.5 transition-colors ${
                    confirmingId === event.id
                      ? "bg-red-500 text-white"
                      : "text-foreground-muted hover:bg-red-500/10 hover:text-red-500"
                  }`}
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
