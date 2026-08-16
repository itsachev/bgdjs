import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../dictionaries";
import { PlusIcon } from "@/components/icons";
import { EventCard } from "@/components/event-card";
import { AmbientGlow } from "@/components/ambient-glow";
import { Kicker } from "@/components/kicker";
import { AdSlot } from "@/components/ad-slot";

// Where in the results grid the in-feed sponsored card is inserted (0-based,
// after this many real event cards) — mirrors the DJs directory's in-feed slot.
const AD_CARD_POSITION = 3;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return { title: dict.eventsPage.title, description: dict.eventsPage.subtitle };
}

export default async function EventsPage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.eventsPage;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, cover_url, starts_at, city, venue_name, price_info")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  return (
    <div className="relative flex-1 overflow-hidden">
      <AmbientGlow variant="directory" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Kicker>{dict.nav.events}</Kicker>
            <h1 className="mt-3 font-display text-display-2 font-bold tracking-tight">{t.title}</h1>
            <p className="mt-4 text-foreground-muted">{t.subtitle}</p>
          </div>
          {user && (
            <Link
              href={`/${locale}/events/create`}
              className="flex items-center gap-1.5 self-start rounded-full bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_color-mix(in_oklch,var(--color-accent)_35%,transparent)] transition-opacity hover:opacity-90"
            >
              <PlusIcon className="h-4 w-4" />
              {t.addEvent}
            </Link>
          )}
        </div>

        <AdSlot
          className="mt-10"
          label={dict.ads.label}
          brand={dict.ads.eventsDirectory.brand}
          headline={dict.ads.eventsDirectory.headline}
          body={dict.ads.eventsDirectory.body}
          ctaLabel={dict.ads.cta}
        />

        {!events || events.length === 0 ? (
          <p className="mt-16 text-foreground-muted">{t.empty}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.flatMap((event, i) => {
              const items = [<EventCard key={event.id} event={event} locale={locale} />];
              if (i === AD_CARD_POSITION) {
                items.push(
                  <AdSlot
                    key="sponsored-slot"
                    variant="event"
                    label={dict.ads.sponsoredLabel}
                    brand={dict.ads.eventsCard.brand}
                    headline={dict.ads.eventsCard.headline}
                    ctaLabel={dict.ads.cta}
                  />
                );
              }
              return items;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
