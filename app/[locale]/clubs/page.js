import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../dictionaries";
import { MapPinIcon } from "@/components/icons";
import { BULGARIAN_CITIES } from "@/lib/bulgarian-cities";
import { EntitySearch } from "@/components/entity-search";

const PAGE_SIZE = 20;

// Genre names are kept in Latin script for both locales, matching the
// sound-profile pills on the profile-completion form.
const QUICK_GENRES = ["House", "Commercial", "Pop Folk"];

// Deterministic pseudo-random ordering — stable across requests/pagination
// since it only depends on each club's id, without needing DB-level randomness.
function seedOf(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return hash;
}

// Lets a search match a city regardless of which locale the club's stored
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
  return `/${locale}/clubs${qs ? `?${qs}` : ""}`;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return { title: dict.clubsPage.title, description: dict.clubsPage.subtitle };
}

export default async function ClubsPage({ params, searchParams }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.clubsPage;

  const { page: pageParam, q: qParam, genre: genreParam } = await searchParams;
  const query = (qParam || "").trim();
  const genre = QUICK_GENRES.includes(genreParam) ? genreParam : "";

  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, avatar_position")
    .eq("role", "club");

  const { data: clubProfiles } = await supabase
    .from("club_profiles")
    .select("id, name, location, sound_profile");

  const clubById = new Map((clubProfiles || []).map((c) => [c.id, c]));

  let clubs = (profiles || [])
    .map((p) => ({ ...p, club: clubById.get(p.id) }))
    .sort((a, b) => seedOf(a.id) - seedOf(b.id));

  if (query) {
    const needle = query.toLowerCase();
    clubs = clubs.filter(({ display_name, club }) =>
      display_name.toLowerCase().includes(needle) ||
      club?.name?.toLowerCase().includes(needle) ||
      cityMatches(club?.location, needle)
    );
  }

  if (genre) {
    clubs = clubs.filter(({ club }) =>
      club?.sound_profile?.split(",").map((g) => g.trim()).includes(genre)
    );
  }

  const totalPages = Math.max(1, Math.ceil(clubs.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageClubs = clubs.slice(start, start + PAGE_SIZE);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-[10%] h-112 w-md rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_38%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-128 w-lg rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_32%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-[20%] h-104 w-104 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_26%,transparent),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <h1 className="bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-4xl font-semibold tracking-tight text-transparent sm:text-5xl xl:text-6xl">
          {t.title}
        </h1>
        <p className="mt-4 text-foreground-muted">{t.subtitle}</p>

        <EntitySearch
          basePath={`/${locale}/clubs`}
          initialQuery={query}
          initialGenre={genre}
          placeholder={t.searchPlaceholder}
          searchLabel={t.search}
        />

        <div className="mt-3 flex flex-wrap gap-2">
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

        {pageClubs.length === 0 ? (
          <p className="mt-16 text-foreground-muted">{query || genre ? t.noResults : t.empty}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageClubs.map(({ id, display_name, avatar_url, avatar_position, club }) => {
              const name = club?.name || display_name;
              const genres = club?.sound_profile
                ? club.sound_profile.split(",").map((g) => g.trim()).filter(Boolean).slice(0, 3)
                : [];

              return (
                <Link
                  key={id}
                  href={`/${locale}/clubs/${encodeURIComponent(display_name)}`}
                  className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,color-mix(in_oklch,var(--color-accent)_7%,var(--color-background-elevated)),color-mix(in_oklch,var(--color-accent-2)_7%,var(--color-background-elevated)))] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-[0_0_32px_color-mix(in_oklch,var(--color-accent)_25%,transparent)]"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-16 -right-16 -z-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_30%,transparent),transparent_70%)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-16 -left-16 -z-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_25%,transparent),transparent_70%)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
                  />

                  <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-background-elevated font-display text-xl font-semibold text-accent">
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

                  <p className="font-display font-semibold tracking-tight transition-colors group-hover:text-accent">
                    {name}
                  </p>

                  {club?.location && (
                    <p className="flex items-center gap-1 text-xs text-foreground-muted">
                      <MapPinIcon className="h-3.5 w-3.5" /> {club.location}
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
