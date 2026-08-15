import Link from "next/link";
import { getDictionary, hasLocale } from "./dictionaries";
import { notFound } from "next/navigation";
import { Hero } from "@/components/hero";
import { createClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/event-card";
import { ParallaxSection } from "@/components/parallax-section";

const UPCOMING_EVENTS_LIMIT = 5;

function PlaceholderGrid({ title, count = 3 }) {
  return (
    <ParallaxSection className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="mb-8 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl border border-border bg-background-elevated"
          />
        ))}
      </div>
    </ParallaxSection>
  );
}

function EventsSection({ title, viewAllLabel, emptyLabel, events, locale }) {
  return (
    <ParallaxSection className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <Link
          href={`/${locale}/events`}
          className="text-sm font-semibold text-accent transition-colors hover:text-accent-2"
        >
          {viewAllLabel} →
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="text-foreground-muted">{emptyLabel}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} locale={locale} />
          ))}
        </div>
      )}
    </ParallaxSection>
  );
}

export default async function HomePage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const { data: hero } = await supabase.from("hero_content").select("*").eq("id", 1).maybeSingle();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, cover_url, starts_at, city, venue_name, price_info")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(UPCOMING_EVENTS_LIMIT);

  return (
    <>
      <Hero dict={dict} locale={locale} hero={hero} />
      <EventsSection
        title={dict.sections.events}
        viewAllLabel={dict.sections.viewAll}
        emptyLabel={dict.eventsPage.empty}
        events={events || []}
        locale={locale}
      />
      <PlaceholderGrid title={dict.sections.djs} />
      <PlaceholderGrid title={dict.sections.clubs} />
    </>
  );
}
