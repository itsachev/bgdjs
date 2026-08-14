import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../../dictionaries";

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
    .eq("display_name", slug)
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
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <div className="h-48 w-48 shrink-0 overflow-hidden rounded-full border border-border bg-background-elevated">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {dj?.stage_name || profile.display_name}
            </h1>
            <span className="rounded-full border border-accent px-3 py-0.5 text-xs font-medium uppercase tracking-wide text-accent">
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

      <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {profile.city && (
          <div>
            <dt className="text-sm text-foreground-muted">{t.city}</dt>
            <dd className="mt-1">{profile.city}</dd>
          </div>
        )}
        {dj?.gender && (
          <div>
            <dt className="text-sm text-foreground-muted">{dict.profile.complete.fields.gender}</dt>
            <dd className="mt-1">{dj.gender}</dd>
          </div>
        )}
        {dj?.location && (
          <div>
            <dt className="text-sm text-foreground-muted">{t.location}</dt>
            <dd className="mt-1">{dj.location}</dd>
          </div>
        )}
        {dj?.hourly_rate != null && (
          <div>
            <dt className="text-sm text-foreground-muted">{t.hourlyRate}</dt>
            <dd className="mt-1">{dj.hourly_rate}</dd>
          </div>
        )}
        {dj?.website && (
          <div>
            <dt className="text-sm text-foreground-muted">{t.website}</dt>
            <dd className="mt-1">
              <a href={dj.website} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-2">
                {dj.website}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {socialLinks.length > 0 && (
        <div className="mt-8">
          <p className="text-sm text-foreground-muted">{t.social}</p>
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
  );
}
