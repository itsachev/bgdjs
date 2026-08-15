import Link from "next/link";
import { getDictionary, hasLocale } from "./dictionaries";
import { notFound } from "next/navigation";
import { Hero } from "@/components/hero";
import { createClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/event-card";
import { ParallaxSection } from "@/components/parallax-section";
import { StatsBar } from "@/components/stats-bar";
import { FeaturedEntities } from "@/components/featured-entities";
import { RankingTeaser } from "@/components/ranking-teaser";
import { CtaBanner } from "@/components/cta-banner";
import { Kicker } from "@/components/kicker";

const UPCOMING_EVENTS_LIMIT = 4;
const FEATURED_LIMIT = 5;

// Deterministic pseudo-random tiebreak — stable across requests since it only
// depends on each profile's id, matching the pattern used on the ranking and
// DJs listing pages.
function seedOf(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return hash;
}

function rankSort(a, b) {
  return b.votes - a.votes || a.tiebreak - b.tiebreak;
}

function EventsSection({ title, viewAllLabel, emptyLabel, events, locale, media, kicker }) {
  return (
    <ParallaxSection className="mx-auto max-w-7xl px-6 py-24" media={media}>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>{kicker}</Kicker>
          <h2 className="mt-3 font-display text-display-2 font-bold tracking-tight">{title}</h2>
        </div>
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

  const [
    { data: hero },
    { data: eventsSection },
    { data: events },
    { count: djCount },
    { count: clubCount },
    { count: eventCount },
    { count: ratingCount },
    { data: djProfiles },
    { data: djDetails },
    { data: clubProfiles },
    { data: clubDetails },
    { data: voteCounts },
  ] = await Promise.all([
    supabase.from("hero_content").select("*").eq("id", 1).maybeSingle(),
    supabase.from("events_section_content").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("events")
      .select("id, title, cover_url, starts_at, city, venue_name, price_info")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(UPCOMING_EVENTS_LIMIT),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "dj"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "club"),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("profile_reviews").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id, display_name, avatar_url, avatar_position").eq("role", "dj"),
    supabase.from("dj_profiles").select("id, stage_name, location, sound_profile"),
    supabase.from("profiles").select("id, display_name, avatar_url, avatar_position").eq("role", "club"),
    supabase.from("club_profiles").select("id, name, location, venue_type"),
    supabase.from("profile_vote_counts").select("target_id, votes"),
  ]);

  const voteCountById = new Map((voteCounts || []).map((v) => [v.target_id, v.votes]));
  const djDetailById = new Map((djDetails || []).map((d) => [d.id, d]));
  const clubDetailById = new Map((clubDetails || []).map((c) => [c.id, c]));

  const topDjs = (djProfiles || [])
    .map((p) => {
      const d = djDetailById.get(p.id);
      return {
        id: p.id,
        displayName: p.display_name,
        name: d?.stage_name || p.display_name,
        avatarUrl: p.avatar_url,
        avatarPosition: p.avatar_position,
        meta: [d?.sound_profile?.split(",")[0]?.trim(), d?.location].filter(Boolean).join(" · "),
        votes: voteCountById.get(p.id) || 0,
        tiebreak: seedOf(p.id),
      };
    })
    .sort(rankSort)
    .slice(0, FEATURED_LIMIT);

  const topClubs = (clubProfiles || [])
    .map((p) => {
      const c = clubDetailById.get(p.id);
      return {
        id: p.id,
        displayName: p.display_name,
        name: c?.name || p.display_name,
        avatarUrl: p.avatar_url,
        avatarPosition: p.avatar_position,
        meta: [c?.venue_type, c?.location].filter(Boolean).join(" · "),
        votes: voteCountById.get(p.id) || 0,
        tiebreak: seedOf(p.id),
      };
    })
    .sort(rankSort)
    .slice(0, FEATURED_LIMIT);

  const eventsSectionTitle = eventsSection?.[`title_${locale}`] || dict.sections.events;
  const eventsSectionMedia = eventsSection?.media_url
    ? { url: eventsSection.media_url, type: eventsSection.media_type }
    : null;

  return (
    <>
      <Hero dict={dict} locale={locale} hero={hero} />

      <StatsBar
        stats={[
          { label: dict.home.stats.djs, value: djCount || 0 },
          { label: dict.home.stats.clubs, value: clubCount || 0 },
          { label: dict.home.stats.events, value: eventCount || 0 },
          { label: dict.home.stats.ratings, value: ratingCount || 0 },
        ]}
      />

      <FeaturedEntities
        kicker={dict.home.featuredDjsKicker}
        title={dict.sections.djs}
        viewAllHref={`/${locale}/djs`}
        viewAllLabel={dict.sections.viewAll}
        items={topDjs}
        locale={locale}
        basePath="djs"
        votesLabel={dict.djsPage.topHouse.votes}
      />

      <EventsSection
        kicker={dict.home.eventsKicker}
        title={eventsSectionTitle}
        viewAllLabel={dict.sections.viewAll}
        emptyLabel={dict.eventsPage.empty}
        events={events || []}
        locale={locale}
        media={eventsSectionMedia}
      />

      <FeaturedEntities
        kicker={dict.home.featuredClubsKicker}
        title={dict.sections.clubs}
        viewAllHref={`/${locale}/clubs`}
        viewAllLabel={dict.sections.viewAll}
        items={topClubs}
        locale={locale}
        basePath="clubs"
        votesLabel={dict.djsPage.topHouse.votes}
      />

      <RankingTeaser
        kicker={dict.home.rankingKicker}
        title={dict.home.rankingTitle}
        viewAllLabel={dict.home.rankingViewAll}
        votesLabel={dict.djsPage.topHouse.votes}
        locale={locale}
        items={topDjs.slice(0, 3)}
      />

      <CtaBanner
        kicker={dict.home.ctaKicker}
        title={dict.home.ctaTitle}
        subtitle={dict.home.ctaSubtitle}
        buttonLabel={dict.home.ctaButton}
        href={`/${locale}/signup`}
      />
    </>
  );
}
