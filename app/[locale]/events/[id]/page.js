import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../../dictionaries";
import { CalendarIcon, MapPinIcon, TicketIcon, UserIcon } from "@/components/icons";
import { EventCoverParallax } from "@/components/event-cover-parallax";
import { EventOwnerActions } from "@/components/event-owner-actions";
import { AdSlot } from "@/components/ad-slot";

function formatFullEventDate(isoString, locale) {
  const date = new Date(isoString);
  const intlLocale = locale === "bg" ? "bg-BG" : "en-GB";
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  if (!hasLocale(locale)) notFound();

  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("title, description").eq("id", id).maybeSingle();

  if (!event) return {};
  return { title: event.title, description: event.description || undefined };
}

export default async function EventDetailPage({ params }) {
  const { locale, id } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.eventDetail;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();

  const isOwner = user?.id === event.organizer_id;

  const { data: organizer } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role")
    .eq("id", event.organizer_id)
    .maybeSingle();

  const organizerHref =
    organizer?.role === "dj"
      ? `/${locale}/djs/${encodeURIComponent(organizer.display_name)}`
      : organizer?.role === "club"
        ? `/${locale}/clubs/${encodeURIComponent(organizer.display_name)}`
        : null;

  return (
    <div className="relative flex-1 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-[10%] h-112 w-md rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_38%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-128 w-lg rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_32%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-[20%] h-104 w-104 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_26%,transparent),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/${locale}/events`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-accent"
          >
            {t.backToEvents}
          </Link>
          {isOwner && (
            <EventOwnerActions
              eventId={event.id}
              locale={locale}
              editLabel={t.edit}
              deleteLabel={t.delete}
              confirmLabel={t.confirmDelete}
              deletingLabel={t.deleting}
            />
          )}
        </div>

        {event.cover_url ? (
          <EventCoverParallax src={event.cover_url} />
        ) : (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-background-elevated">
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_oklch,var(--color-accent)_18%,var(--color-background-elevated)),color-mix(in_oklch,var(--color-accent-2)_18%,var(--color-background-elevated)))]">
              <CalendarIcon className="h-10 w-10 text-foreground-muted" />
            </div>
          </div>
        )}

        <h1 className="mt-8 bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-3xl font-semibold tracking-tight text-transparent sm:text-4xl xl:text-5xl">
          {event.title}
        </h1>

        <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
            <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
              <CalendarIcon className="h-3.5 w-3.5" /> {t.dateLabel}
            </dt>
            <dd className="mt-1.5 font-medium capitalize">{formatFullEventDate(event.starts_at, locale)}</dd>
          </div>
          {(event.venue_name || event.city) && (
            <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                <MapPinIcon className="h-3.5 w-3.5" /> {t.locationLabel}
              </dt>
              <dd className="mt-1.5 font-medium">{[event.venue_name, event.city].filter(Boolean).join(", ")}</dd>
            </div>
          )}
          {event.price_info && (
            <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                <TicketIcon className="h-3.5 w-3.5" /> {t.priceLabel}
              </dt>
              <dd className="mt-1.5 font-medium">{event.price_info}</dd>
            </div>
          )}
          {organizer && (
            <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                <UserIcon className="h-3.5 w-3.5" /> {t.hostedBy}
              </dt>
              <dd className="mt-1.5">
                {organizerHref ? (
                  <Link
                    href={organizerHref}
                    className="flex items-center gap-2 font-medium text-accent hover:text-accent-2"
                  >
                    {organizer.avatar_url ? (
                      <Image
                        src={organizer.avatar_url}
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : null}
                    {organizer.display_name}
                  </Link>
                ) : (
                  <span className="font-medium">{organizer.display_name}</span>
                )}
              </dd>
            </div>
          )}
        </dl>

        {event.description && (
          <p className="mt-8 whitespace-pre-wrap text-foreground-muted">{event.description}</p>
        )}

        <AdSlot
          className="mt-8"
          label={dict.ads.label}
          brand={dict.ads.eventDetail.brand}
          headline={dict.ads.eventDetail.headline}
          body={dict.ads.eventDetail.body}
          ctaLabel={dict.ads.cta}
        />

        {event.ticket_url && (
          <a
            href={event.ticket_url}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_color-mix(in_oklch,var(--color-accent)_35%,transparent)] transition-opacity hover:opacity-90"
          >
            <TicketIcon className="h-4 w-4" />
            {t.getTickets}
          </a>
        )}
      </div>
    </div>
  );
}
