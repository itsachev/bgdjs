import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../../dictionaries";
import { MapPinIcon, GlobeIcon, UserIcon, LinkIcon, ClockIcon } from "@/components/icons";

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, bio, role")
    .eq("display_name", decodeURIComponent(slug))
    .single();

  if (!profile || profile.role !== "dj") return {};

  const { data: dj } = await supabase
    .from("dj_profiles")
    .select("stage_name")
    .eq("id", profile.id)
    .maybeSingle();

  return {
    title: dj?.stage_name || profile.display_name,
    description: profile.bio || undefined,
  };
}

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
    .select("id, role, display_name, avatar_url, avatar_position, bio, city")
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

      {profile.avatar_url && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 opacity-30 mask-[linear-gradient(to_left,black_40%,transparent)] md:block"
        >
          <Image
            src={profile.avatar_url}
            alt=""
            fill
            sizes="50vw"
            className="object-cover"
            style={{ objectPosition: profile.avatar_position || "50% 50%" }}
          />
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start lg:gap-16">
          <div className="flex flex-col items-center text-center lg:sticky lg:top-24 lg:items-start lg:text-left">
            <h1 className="uppercase bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display font-semibold tracking-tight text-transparent sm:text-3xl md:text-6xl">
              {dj?.stage_name || profile.display_name}
            </h1>

            {profile.bio && (
              <p className="mt-4 w-full text-left text-foreground-muted lg:max-w-md">{profile.bio}</p>
            )}

            {isOwner && (
              <a
                href={`/${locale}/profile/complete`}
                className="mt-4 inline-block text-sm text-accent hover:text-accent-2"
              >
                {t.editProfile}
              </a>
            )}
          </div>

          <div className="mt-10 lg:mt-0">
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
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

            <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {profile.city && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <MapPinIcon className="h-3.5 w-3.5" /> {t.city}
                  </dt>
                  <dd className="mt-1.5 font-medium">{profile.city}</dd>
                </div>
              )}
              {dj?.gender && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <UserIcon className="h-3.5 w-3.5" /> {dict.profile.complete.fields.gender}
                  </dt>
                  <dd className="mt-1.5 font-medium">{dj.gender}</dd>
                </div>
              )}
              {dj?.location && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <MapPinIcon className="h-3.5 w-3.5" /> {t.location}
                  </dt>
                  <dd className="mt-1.5 font-medium">{dj.location}</dd>
                </div>
              )}
              {dj?.website && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <GlobeIcon className="h-3.5 w-3.5" /> {t.website}
                  </dt>
                  <dd className="mt-1.5 font-medium">
                    <a href={dj.website} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-2">
                      {dj.website}
                    </a>
                  </dd>
                </div>
              )}
              {dj?.years_active != null && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <ClockIcon className="h-3.5 w-3.5" /> {t.yearsActive}
                  </dt>
                  <dd className="mt-1.5 font-medium">{dj.years_active}</dd>
                </div>
              )}
            </dl>

            {socialLinks.length > 0 && (
              <div className="mt-6">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                  <LinkIcon className="h-3.5 w-3.5" /> {t.social}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-border px-4 py-1.5 text-sm text-accent transition-colors hover:border-accent hover:text-accent-2"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
