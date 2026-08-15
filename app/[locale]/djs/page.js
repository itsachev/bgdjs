import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../dictionaries";
import { MapPinIcon, CrownIcon, HeartIcon } from "@/components/icons";
import { BULGARIAN_CITIES } from "@/lib/bulgarian-cities";
import { EntitySearch } from "@/components/entity-search";

const PAGE_SIZE = 20;

// Matches the presence heartbeat interval (60s) with buffer for network lag.
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

function isOnline(lastSeenAt) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

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

function TopGenreDjs({ title, djs, locale, votesLabel }) {
  if (djs.length === 0) return null;

  return (
    <div className="my-20">
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {djs.map(({ id, display_name, avatar_url, avatar_position, dj, votes }, i) => {
          const name = dj?.stage_name || display_name;
          const rank = i + 1;
          return (
            <Link
              key={id}
              href={`/${locale}/djs/${encodeURIComponent(display_name)}`}
              className="group relative flex flex-col items-center gap-2 rounded-2xl border border-border bg-background-elevated p-4 text-center transition-colors hover:border-accent"
            >
              {rank === 1 && <CrownIcon className="absolute right-3 top-3 h-4 w-4 text-yellow-400" />}
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-background">
                {avatar_url ? (
                  <Image
                    src={avatar_url}
                    alt={name}
                    fill
                    sizes="64px"
                    className="object-cover"
                    style={{ objectPosition: avatar_position || "50% 50%" }}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-display text-lg font-semibold text-accent">
                    {name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="truncate text-sm font-semibold tracking-tight transition-colors group-hover:text-accent">
                {name}
              </p>
              <p className="flex items-center gap-1 text-xs text-foreground-muted">
                <HeartIcon className="h-3.5 w-3.5" /> {votes} {votesLabel}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
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
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-[10%] h-112 w-md rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_38%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-128 w-lg rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_32%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-[20%] h-104 w-104 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_26%,transparent),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-4xl font-semibold tracking-tight text-transparent sm:text-5xl xl:text-6xl">
              {t.title}
            </h1>
            <p className="mt-4 text-foreground-muted">{t.subtitle}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-72">
            <EntitySearch
              basePath={`/${locale}/djs`}
              searchApi="/api/djs/search"
              initialQuery={query}
              initialGenre={genre}
              placeholder={t.searchPlaceholder}
              searchLabel={t.search}
            />
            <div className="flex flex-wrap gap-2">
              {QUICK_GENRES.map((g) => {
                const active = genre === g;
                return (
                  <Link
                    key={g}
                    href={pageHref(locale, { page: 1, q: query, genre: active ? "" : g })}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-transparent bg-accent text-white"
                        : "border-border text-foreground-muted hover:text-foreground"
                    }`}
                  >
                    {g}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <TopGenreDjs title={t.topHouse.title} djs={topHouseDjs} locale={locale} votesLabel={t.topHouse.votes} />
        <TopGenreDjs title={t.topPopFolk.title} djs={topPopFolkDjs} locale={locale} votesLabel={t.topPopFolk.votes} />

        {pageDjs.length === 0 ? (
          <p className="mt-16 text-foreground-muted">{query || genre ? t.noResults : t.empty}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageDjs.map(({ id, display_name, avatar_url, avatar_position, last_seen_at, dj }) => {
              const name = dj?.stage_name || display_name;
              const genres = dj?.sound_profile
                ? dj.sound_profile.split(",").map((g) => g.trim()).filter(Boolean).slice(0, 3)
                : [];

              return (
                <Link
                  key={id}
                  href={`/${locale}/djs/${encodeURIComponent(display_name)}`}
                  className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,color-mix(in_oklch,var(--color-accent)_7%,var(--color-background-elevated)),color-mix(in_oklch,var(--color-accent-2)_7%,var(--color-background-elevated)))] bg-size-[200%_200%] bg-top-left p-6 text-center transition-all duration-500 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:bg-bottom-right"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-16 -right-16 -z-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_30%,transparent),transparent_70%)] opacity-30 blur-2xl transition-all duration-500 [@media(hover:hover)]:group-hover:scale-125 [@media(hover:hover)]:group-hover:opacity-100"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-16 -left-16 -z-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_25%,transparent),transparent_70%)] opacity-30 blur-2xl transition-all duration-500 [@media(hover:hover)]:group-hover:scale-125 [@media(hover:hover)]:group-hover:opacity-80"
                  />

                  <div className="relative h-20 w-20 shrink-0">
                    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-border bg-background-elevated font-display text-xl font-semibold text-accent">
                      {avatar_url ? (
                        <Image
                          src={avatar_url}
                          alt={name}
                          fill
                          sizes="80px"
                          className="object-cover"
                          style={{ objectPosition: avatar_position || "50% 50%" }}
                        />
                      ) : (
                        name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    {isOnline(last_seen_at) && (
                      <span className="group/status absolute bottom-0.5 right-0.5">
                        <span className="block h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500" />
                        <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 whitespace-nowrap rounded-md bg-background-elevated px-2 py-1 text-xs font-medium text-foreground opacity-0 shadow-lg ring-1 ring-border transition-opacity duration-150 group-hover/status:opacity-100">
                          {t.online}
                        </span>
                      </span>
                    )}
                  </div>

                  <p className="font-display font-semibold tracking-tight transition-colors group-hover:text-accent">
                    {name}
                  </p>

                  {dj?.location && (
                    <p className="flex items-center gap-1 text-xs text-foreground-muted">
                      <MapPinIcon className="h-3.5 w-3.5" /> {dj.location}
                    </p>
                  )}

                  {genres.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-center gap-1.5">
                      {genres.map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground-muted"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <Link
              href={pageHref(locale, { page: currentPage - 1, q: query, genre })}
              aria-disabled={currentPage <= 1}
              className={`rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors ${
                currentPage <= 1
                  ? "pointer-events-none opacity-40"
                  : "hover:border-accent hover:text-accent"
              }`}
            >
              {t.prev}
            </Link>
            <p className="text-sm text-foreground-muted">
              {t.page} {currentPage} / {totalPages}
            </p>
            <Link
              href={pageHref(locale, { page: currentPage + 1, q: query, genre })}
              aria-disabled={currentPage >= totalPages}
              className={`rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors ${
                currentPage >= totalPages
                  ? "pointer-events-none opacity-40"
                  : "hover:border-accent hover:text-accent"
              }`}
            >
              {t.next}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
