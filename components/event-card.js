import Link from "next/link";
import Image from "next/image";
import { CalendarIcon, MapPinIcon } from "@/components/icons";

function formatEventDate(isoString, locale) {
  const date = new Date(isoString);
  const intlLocale = locale === "bg" ? "bg-BG" : "en-GB";
  return {
    day: new Intl.DateTimeFormat(intlLocale, { day: "numeric" }).format(date),
    month: new Intl.DateTimeFormat(intlLocale, { month: "short" }).format(date).replace(".", ""),
    time: new Intl.DateTimeFormat(intlLocale, { hour: "2-digit", minute: "2-digit" }).format(date),
  };
}

export function EventCard({ event, locale }) {
  const { day, month, time } = formatEventDate(event.starts_at, locale);

  return (
    <Link
      href={`/${locale}/events/${event.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background-elevated/40 transition-all duration-500 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[0_0_32px_color-mix(in_oklch,var(--color-accent)_25%,transparent)]">
      <div className="relative aspect-video w-full overflow-hidden bg-background-elevated">
        {event.cover_url ? (
          <Image
            src={event.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_oklch,var(--color-accent)_18%,var(--color-background-elevated)),color-mix(in_oklch,var(--color-accent-2)_18%,var(--color-background-elevated)))]">
            <CalendarIcon className="h-8 w-8 text-foreground-muted" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col items-center rounded-lg bg-background/90 px-3 py-1.5 text-center leading-none shadow-lg backdrop-blur-sm">
          <span className="font-display text-lg font-bold text-accent">{day}</span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-foreground-muted">{month}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-display font-semibold tracking-tight">{event.title}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
          <span className="flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5" /> {time}
          </span>
          {(event.venue_name || event.city) && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5" />
              {[event.venue_name, event.city].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
        {event.price_info && (
          <span className="mt-1 self-start rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted">
            {event.price_info}
          </span>
        )}
      </div>
    </Link>
  );
}
