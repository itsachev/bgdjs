import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../../dictionaries";
import { MapPinIcon, GlobeIcon, MusicNoteIcon, MicIcon, UsersIcon, PhoneIcon, LinkIcon, BuildingIcon } from "@/components/icons";

export default async function ClubProfilePage({ params }) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.profile.view;
  const tf = dict.profile.complete.fields;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, display_name, avatar_url, bio")
    .eq("display_name", decodeURIComponent(slug))
    .single();

  if (!profile || profile.role !== "club") notFound();

  const { data: club } = await supabase.from("club_profiles").select("*").eq("id", profile.id).maybeSingle();

  const genres = club?.sound_profile
    ? club.sound_profile.split(",").map((g) => g.trim()).filter(Boolean)
    : [];
  const socialLinks = club?.social_links
    ? club.social_links.split("\n").map((l) => l.trim()).filter(Boolean)
    : [];

  const isOwner = user?.id === profile.id;

  return (
    <div className="relative flex-1 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-[10%] h-112 w-md rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_38%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-128 w-lg rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_32%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-[20%] h-104 w-104 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_26%,transparent),transparent_70%)] blur-3xl" />
      </div>

      {profile.avatar_url && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 opacity-30 mask-[linear-gradient(to_left,black_40%,transparent)] md:block"
        >
          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="relative mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <div className="h-48 w-48 shrink-0 overflow-hidden rounded-full border border-border bg-background-elevated">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
            <h1 className="bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display font-semibold tracking-tight text-transparent sm:text-3xl md:text-6xl">
              {club?.name || profile.display_name}
            </h1>
            <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-white">
              {t.clubBadge}
            </span>
          </div>
          {(club?.description || profile.bio) && (
            <p className="text-foreground-muted">{club?.description || profile.bio}</p>
          )}

          {isOwner && (
            <a
              href={`/${locale}/profile/complete`}
              className="mt-1 inline-block self-center text-sm text-accent hover:text-accent-2 sm:self-start"
            >
              {t.editProfile}
            </a>
          )}
        </div>
      </div>

      {genres.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {genres.map((genre) => (
            <span
              key={genre}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground-muted"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {club?.venue_type && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <BuildingIcon /> {tf.venue_type}
            </dt>
            <dd className="mt-1">{club.venue_type}</dd>
          </div>
        )}
        {club?.genre && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <MusicNoteIcon /> {t.genre}
            </dt>
            <dd className="mt-1">{club.genre}</dd>
          </div>
        )}
        {club?.location && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <MapPinIcon /> {t.location}
            </dt>
            <dd className="mt-1">{club.location}</dd>
          </div>
        )}
        {club?.resident_dj && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <MicIcon /> {tf.resident_dj}
            </dt>
            <dd className="mt-1">{club.resident_dj}</dd>
          </div>
        )}
        {club?.capacity != null && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <UsersIcon /> {tf.capacity}
            </dt>
            <dd className="mt-1">{club.capacity}</dd>
          </div>
        )}
        {club?.reservation_contact && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <PhoneIcon /> {tf.reservation_contact}
            </dt>
            <dd className="mt-1">{club.reservation_contact}</dd>
          </div>
        )}
        {club?.website && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <GlobeIcon /> {t.website}
            </dt>
            <dd className="mt-1">
              <a href={club.website} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-2">
                {club.website}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {socialLinks.length > 0 && (
        <div className="mt-8">
          <p className="flex items-center gap-1.5 text-sm text-foreground-muted">
            <LinkIcon /> {t.social}
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {socialLinks.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-2">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </div>
  );
}
