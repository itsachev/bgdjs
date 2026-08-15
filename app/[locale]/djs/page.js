import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../dictionaries";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { BULGARIAN_CITIES } from "@/lib/bulgarian-cities";
import { EntitySearch } from "@/components/entity-search";
import { AmbientGlow } from "@/components/ambient-glow";
import { Kicker } from "@/components/kicker";
import { DjDirectory } from "@/components/dj-directory";

const PAGE_SIZE = 20;

// Genre names are kept in Latin script for both locales, matching the
// sound-profile pills on the profile-completion form.
const QUICK_GENRES = ["House", "Commercial", "Pop Folk"];

// Deterministic pseudo-random ordering — stable across requests/pagination
// since it only depends on each DJ's id, without needing DB-level randomness.
function seedOf(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return hash;
}

// Profiles with a photo and the core fields filled in surface first; within
// the same completeness tier, ordering stays stable via seedOf().
function completenessOf({ avatar_url, bio, dj }) {
  return [avatar_url, bio, dj?.stage_name, dj?.gender, dj?.location].filter(Boolean).length;
}

// Lets a search match a city regardless of which locale the DJ's stored
// canonical value ("Sofia") vs. the query ("София") happen to be in.
const CITY_LABELS = new Map(
  BULGARIAN_CITIES.map((city) => [
    city.value,
    [city.value, city.en, city.bg].map((s) => s.toLowerCase()),
  ])
);

function cityMatches(location, needle) {
  if (!location) return false;
  const labels = CITY_LABELS.get(location) || [location.toLowerCase()];
  return labels.some((label) => label.includes(needle));
}

function pageHref(locale, { page, q, genre }) {
  const search = new URLSearchParams();
  if (q) search.set("q", q);
  if (genre) search.set("genre", genre);
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return `/${locale}/djs${qs ? `?${qs}` : ""}`;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return { title: dict.djsPage.title, description: dict.djsPage.subtitle };
}

export default async function DjsPage({ params, searchParams }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.djsPage;

  const { page: pageParam, q: qParam, genre: genreParam } = await searchParams;
  const query = (qParam || "").trim();
  const genre = QUICK_GENRES.includes(genreParam) ? genreParam : "";

  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, avatar_position, bio, last_seen_at")
    .eq("role", "dj");

  const { data: djProfiles } = await supabase
    .from("dj_profiles")
    .select("id, stage_name, gender, location, sound_profile");

  const { data: voteCounts } = await supabase.from("profile_vote_counts").select("target_id, votes");
  const voteCountById = new Map((voteCounts || []).map((v) => [v.target_id, v.votes]));

  const djById = new Map((djProfiles || []).map((d) => [d.id, d]));

  let djs = (profiles || [])
    .map((p) => ({ ...p, dj: djById.get(p.id) }))
    .sort((a, b) => completenessOf(b) - completenessOf(a) || seedOf(a.id) - seedOf(b.id));

  function topDjsFor(genre) {
    return djs
      .filter(({ dj }) => dj?.sound_profile?.split(",").map((g) => g.trim()).includes(genre))
      .map((d) => ({ ...d, votes: voteCountById.get(d.id) || 0 }))
      .sort((a, b) => b.votes - a.votes || seedOf(a.id) - seedOf(b.id))
      .slice(0, 5);
  }

  const topHouseDjs = topDjsFor("House");
  const topPopFolkDjs = topDjsFor("Pop Folk");

  if (query) {
    const needle = query.toLowerCase();
    djs = djs.filter(({ display_name, dj }) =>
      display_name.toLowerCase().includes(needle) ||
      dj?.stage_name?.toLowerCase().includes(needle) ||
      cityMatches(dj?.location, needle)
    );
  }

  if (genre) {
    djs = djs.filter(({ dj }) =>
      dj?.sound_profile?.split(",").map((g) => g.trim()).includes(genre)
    );
  }

  const totalPages = Math.max(1, Math.ceil(djs.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageDjs = djs.slice(start, start + PAGE_SIZE);

  return (
    <div className="relative flex-1 overflow-hidden">
      <AmbientGlow variant="directory" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div>
          <Kicker>{dict.nav.djs}</Kicker>
          <h1 className="mt-3 font-display text-display-2 font-bold tracking-tight">{t.title}</h1>
          <p className="mt-4 max-w-lg text-foreground-muted">{t.subtitle}</p>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-y border-border py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {QUICK_GENRES.map((g) => {
              const active = genre === g;
              return (
                <Link
                  key={g}
                  href={pageHref(locale, { page: 1, q: query, genre: active ? "" : g })}
                  className={`relative pb-1 text-sm font-semibold uppercase tracking-wide transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 after:content-[''] ${
                    active ? "text-accent after:scale-x-100" : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {g}
                </Link>
              );
            })}
          </div>
          <EntitySearch
            basePath={`/${locale}/djs`}
            searchApi="/api/djs/search"
            initialQuery={query}
            initialGenre={genre}
            placeholder={t.searchPlaceholder}
            searchLabel={t.search}
            className="w-full sm:w-72"
          />
        </div>

        <DjDirectory
          topHouseDjs={topHouseDjs}
          topHouseTitle={t.topHouse.title}
          topHouseVotesLabel={t.topHouse.votes}
          topPopFolkDjs={topPopFolkDjs}
          topPopFolkTitle={t.topPopFolk.title}
          topPopFolkVotesLabel={t.topPopFolk.votes}
          pageDjs={pageDjs}
          locale={locale}
          onlineLabel={t.online}
          emptyMessage={query || genre ? t.noResults : t.empty}
        />

        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-4">
            <Link
              href={pageHref(locale, { page: currentPage - 1, q: query, genre })}
              aria-disabled={currentPage <= 1}
              aria-label={t.prev}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors ${
                currentPage <= 1 ? "pointer-events-none opacity-30" : "hover:border-accent hover:text-accent"
              }`}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
            <p className="text-sm font-medium text-foreground-muted">
              {t.page} {currentPage} / {totalPages}
            </p>
            <Link
              href={pageHref(locale, { page: currentPage + 1, q: query, genre })}
              aria-disabled={currentPage >= totalPages}
              aria-label={t.next}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors ${
                currentPage >= totalPages ? "pointer-events-none opacity-30" : "hover:border-accent hover:text-accent"
              }`}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
