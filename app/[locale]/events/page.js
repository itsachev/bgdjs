import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../dictionaries";
import { PlusIcon } from "@/components/icons";
import { EventCard } from "@/components/event-card";

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
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-[10%] h-112 w-md rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_38%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-128 w-lg rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_32%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-[20%] h-104 w-104 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_26%,transparent),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-4xl font-semibold tracking-tight text-transparent sm:text-5xl xl:text-6xl">
              {t.title}
            </h1>
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

        {!events || events.length === 0 ? (
          <p className="mt-16 text-foreground-muted">{t.empty}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
