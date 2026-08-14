import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../../dictionaries";
import { MapPinIcon, GlobeIcon, UserIcon, LinkIcon, ClockIcon } from "@/components/icons";

export default async function DjProfilePage({ params }) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.profile.view;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, display_name, avatar_url, bio, city")
    .eq("display_name", decodeURIComponent(slug))
    .single();

  if (!profile || profile.role !== "dj") notFound();

  const { data: dj } = await supabase.from("dj_profiles").select("*").eq("id", profile.id).maybeSingle();

  const genres = dj?.sound_profile
    ? dj.sound_profile.split(",").map((g) => g.trim()).filter(Boolean)
    : [];
  const socialLinks = dj?.social_links
    ? dj.social_links.split("\n").map((l) => l.trim()).filter(Boolean)
    : [];

  const isOwner = user?.id === profile.id;

  return (
    <div className="relative flex-1 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-[10%] h-112 w-md rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_38%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-128 w-lg rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_32%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-[20%] h-104 w-104 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_26%,transparent),transparent_70%)] blur-3xl" />
      </div>

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
              {dj?.stage_name || profile.display_name}
            </h1>
            <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-white">
              {t.djBadge}
            </span>
          </div>
          {profile.bio && <p className="text-foreground-muted">{profile.bio}</p>}

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

      <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {profile.city && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <MapPinIcon /> {t.city}
            </dt>
            <dd className="mt-1">{profile.city}</dd>
          </div>
        )}
        {dj?.gender && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <UserIcon /> {dict.profile.complete.fields.gender}
            </dt>
            <dd className="mt-1">{dj.gender}</dd>
          </div>
        )}
        {dj?.location && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <MapPinIcon /> {t.location}
            </dt>
            <dd className="mt-1">{dj.location}</dd>
          </div>
        )}
        {dj?.website && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <GlobeIcon /> {t.website}
            </dt>
            <dd className="mt-1">
              <a href={dj.website} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-2">
                {dj.website}
              </a>
            </dd>
          </div>
        )}
        {dj?.years_active != null && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <ClockIcon /> {t.yearsActive}
            </dt>
            <dd className="mt-1">{dj.years_active}</dd>
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
