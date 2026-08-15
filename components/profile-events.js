"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { createClient } from "@/lib/supabase/client";
import { CalendarIcon, CloseIcon } from "@/components/icons";

function formatCompactDate(isoString, locale) {
  const date = new Date(isoString);
  const intlLocale = locale === "bg" ? "bg-BG" : "en-GB";
  return {
    day: new Intl.DateTimeFormat(intlLocale, { day: "numeric" }).format(date),
    month: new Intl.DateTimeFormat(intlLocale, { month: "short" }).format(date).replace(".", ""),
    time: new Intl.DateTimeFormat(intlLocale, { hour: "2-digit", minute: "2-digit" }).format(date),
  };
}

export function ProfileEvents({ events: initialEvents, locale, title, isOwner, removeLabel }) {
  const [events, setEvents] = useState(initialEvents || []);
  const listRef = useRef(null);

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

  if (events.length === 0) return null;

  async function handleRemove(id) {
    setEvents((current) => current.filter((e) => e.id !== id));
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
  }

  return (
    <div>
      {title && <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{title}</p>}
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
                  onClick={() => handleRemove(event.id)}
                  aria-label={removeLabel}
                  className="shrink-0 rounded-full p-1.5 text-foreground-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
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
