import { notFound } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../../dictionaries";
import {
  MapPinIcon,
  GlobeIcon,
  UserIcon,
  LinkIcon,
  ClockIcon,
  MusicNoteIcon,
  InstagramIcon,
  FacebookIcon,
  TiktokIcon,
  SoundcloudIcon,
  MixcloudIcon,
  YoutubeIcon,
} from "@/components/icons";
import { ProfileGallery } from "@/components/profile-gallery";
import { ProfileParallaxBg } from "@/components/profile-parallax-bg";
import { MixesSection } from "@/components/mixes-section";
import { ProfileEvents } from "@/components/profile-events";
import { RatingSection } from "@/components/rating-section";
import { ContactSection } from "@/components/contact-section";
import { AmbientGlow } from "@/components/ambient-glow";
import { AdSlot } from "@/components/ad-slot";
import { MessageButton } from "@/components/message-button";
import { canUseMessaging } from "@/lib/auth";

const SOCIAL_PLATFORMS = [
  { key: "instagram_url", label: "Instagram", icon: InstagramIcon, color: "text-pink-500" },
  { key: "facebook_url", label: "Facebook", icon: FacebookIcon, color: "text-blue-600" },
  { key: "tiktok_url", label: "TikTok", icon: TiktokIcon, color: "text-rose-500" },
  { key: "soundcloud_url", label: "SoundCloud", icon: SoundcloudIcon, color: "text-orange-500" },
  { key: "mixcloud_url", label: "Mixcloud", icon: MixcloudIcon, color: "text-sky-500" },
  { key: "youtube_url", label: "YouTube", icon: YoutubeIcon, color: "text-red-600" },
];

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

  const [user, { data: profile }] = await Promise.all([
    getAuthUser(),
    supabase
      .from("profiles")
      .select("id, role, display_name, avatar_url, avatar_position, bio, city")
      .eq("display_name", decodeURIComponent(slug))
      .single(),
  ]);

  if (!profile || profile.role !== "dj") notFound();

  const isOwner = user?.id === profile.id;

  const [
    { data: dj },
    { data: galleryPhotos },
    { data: mixes },
    { data: events },
    { data: reviewRows },
    { data: viewerProfile },
  ] = await Promise.all([
    supabase.from("dj_profiles").select("*").eq("id", profile.id).maybeSingle(),
    supabase
      .from("profile_gallery")
      .select("id, url, width, height")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("dj_mixes")
      .select("id, title, url, platform")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("events")
      .select("id, title, cover_url, starts_at, city, venue_name, price_info")
      .eq("organizer_id", profile.id)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }),
    supabase
      .from("profile_reviews")
      .select("id, reviewer_id, criteria, body, created_at")
      .eq("target_id", profile.id)
      .order("created_at", { ascending: false }),
    user && !isOwner
      ? supabase
          .from("profiles")
          .select("id, role, display_name, avatar_url, avatar_position")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const genres = dj?.sound_profile
    ? dj.sound_profile.split(",").map((g) => g.trim()).filter(Boolean)
    : [];
  const socialLinks = SOCIAL_PLATFORMS.filter((p) => dj?.[p.key]);

  const reviewerIds = [...new Set((reviewRows || []).map((r) => r.reviewer_id))];
  const { data: reviewerProfiles } = reviewerIds.length
    ? await supabase.from("profiles").select("id, display_name, avatar_url, avatar_position").in("id", reviewerIds)
    : { data: [] };
  const reviewerById = new Map((reviewerProfiles || []).map((p) => [p.id, p]));

  const reviews = (reviewRows || []).map((r) => {
    const reviewer = reviewerById.get(r.reviewer_id);
    return {
      id: r.id,
      reviewerId: r.reviewer_id,
      reviewerName: reviewer?.display_name || "—",
      reviewerAvatarUrl: reviewer?.avatar_url || null,
      reviewerAvatarPosition: reviewer?.avatar_position || null,
      criteria: r.criteria || {},
      body: r.body,
      createdAt: r.created_at,
    };
  });

  const viewer = viewerProfile
    ? {
        name: viewerProfile.display_name,
        avatarUrl: viewerProfile.avatar_url,
        avatarPosition: viewerProfile.avatar_position,
      }
    : null;

  // Logged-out visitors still see the button (routed through login first);
  // logged-in fans don't, since messaging is DJ/club-to-DJ/club only.
  const canViewerMessage = !viewerProfile || canUseMessaging(viewerProfile.role);
  const messageTargetPath = `/${locale}/messages/new?with=${profile.id}`;
  const messageHref = viewerProfile
    ? messageTargetPath
    : `/${locale}/login?next=${encodeURIComponent(messageTargetPath)}`;

  return (
    <div className="relative flex-1 overflow-hidden">
      <AmbientGlow variant="profile" />

      {profile.avatar_url && (
        <ProfileParallaxBg src={profile.avatar_url} position={profile.avatar_position} align="left" />
      )}

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start lg:gap-16">
          <div className="flex flex-col items-center text-center lg:sticky lg:top-24 lg:items-start lg:text-left">
            <h1 className="uppercase bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-3xl font-semibold tracking-tight text-transparent sm:text-4xl md:text-5xl xl:text-6xl">
              {dj?.stage_name || profile.display_name}
            </h1>

            {profile.bio && (
              <p className="mt-4 w-full whitespace-pre-wrap text-left text-foreground-muted lg:max-w-md">{profile.bio}</p>
            )}

            {isOwner && (
              <a
                href={`/${locale}/profile/complete`}
                className="mt-4 inline-block text-sm text-accent hover:text-accent-2"
              >
                {t.editProfile}
              </a>
            )}

            {!isOwner && canViewerMessage && <MessageButton href={messageHref} label={t.message} />}
          </div>

          <div className="mt-10 lg:mt-0">
            {genres.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                  <MusicNoteIcon className="h-3.5 w-3.5" /> {t.soundProfile}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground-muted"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
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
                  {socialLinks.map(({ key, label, icon: PlatformIcon, color }) => (
                    <a
                      key={key}
                      href={dj[key]}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm text-accent transition-colors hover:border-accent hover:text-accent-2"
                    >
                      <PlatformIcon className={`h-3.5 w-3.5 ${color}`} /> {label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {events?.length > 0 && (
          <div className="mt-28">
            <ProfileEvents
              events={events}
              locale={locale}
              title={t.events}
              isOwner={isOwner}
              removeLabel={t.removeEvent}
              confirmLabel={t.confirmRemoveEvent}
            />
          </div>
        )}

        {mixes?.length > 0 && (
          <div className="mt-28">
            <MixesSection mixes={mixes} title={t.mixes} />
          </div>
        )}

        {galleryPhotos?.length > 0 && (
          <div className="mt-28">
            <ProfileGallery
              photos={galleryPhotos}
              title={t.gallery}
              seeAllLabel={t.gallerySeeAll}
              seeLessLabel={t.gallerySeeLess}
            />
          </div>
        )}

        <div className="mt-28">
          <AdSlot
            label={dict.ads.label}
            brand={dict.ads.djProfile.brand}
            headline={dict.ads.djProfile.headline}
            body={dict.ads.djProfile.body}
            ctaLabel={dict.ads.cta}
          />
        </div>

        <div className="mt-28">
          <RatingSection
            targetId={profile.id}
            targetRole="dj"
            reviews={reviews}
            userId={user?.id ?? null}
            viewer={viewer}
            locale={locale}
            dict={t.rating}
            title={t.rating.title}
            seeAllLabel={t.gallerySeeAll}
            seeLessLabel={t.gallerySeeLess}
          />
        </div>

        {dj?.contact_email && (
          <div className="mt-28">
            <ContactSection
              email={dj.contact_email}
              title={t.contact.title}
              subtitle={t.contact.subtitle}
              eyebrow={t.contact.eyebrow}
              copyLabel={t.contact.copy}
              copiedLabel={t.contact.copied}
            />
          </div>
        )}
      </div>
    </div>
  );
}
