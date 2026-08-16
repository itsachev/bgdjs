import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../../dictionaries";
import {
  MapPinIcon,
  GlobeIcon,
  MusicNoteIcon,
  MicIcon,
  UsersIcon,
  PhoneIcon,
  LinkIcon,
  BuildingIcon,
  InstagramIcon,
  FacebookIcon,
  TiktokIcon,
  SoundcloudIcon,
  MixcloudIcon,
  YoutubeIcon,
} from "@/components/icons";
import { ProfileGallery } from "@/components/profile-gallery";
import { ProfileEvents } from "@/components/profile-events";
import { ProfileParallaxBg } from "@/components/profile-parallax-bg";
import { RatingSection } from "@/components/rating-section";
import { AmbientGlow } from "@/components/ambient-glow";
import { MessageButton } from "@/components/message-button";
import { getCurrentProfile, canUseMessaging } from "@/lib/auth";

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

  if (!profile || profile.role !== "club") return {};

  const { data: club } = await supabase
    .from("club_profiles")
    .select("name, description")
    .eq("id", profile.id)
    .maybeSingle();

  return {
    title: club?.name || profile.display_name,
    description: club?.description || profile.bio || undefined,
  };
}

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
    .select("id, role, display_name, avatar_url, avatar_position, bio")
    .eq("display_name", decodeURIComponent(slug))
    .single();

  if (!profile || profile.role !== "club") notFound();

  const { data: club } = await supabase.from("club_profiles").select("*").eq("id", profile.id).maybeSingle();

  const residentEntries = club?.resident_djs || [];
  const residentIds = residentEntries.filter((e) => e.id).map((e) => e.id);
  const residentCustomNames = residentEntries.filter((e) => e.name).map((e) => e.name);

  let residentDjs = [];
  if (residentIds.length) {
    const { data: residentProfiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", residentIds);
    const { data: residentDjProfiles } = await supabase
      .from("dj_profiles")
      .select("id, stage_name")
      .in("id", residentIds);
    const stageNameById = new Map((residentDjProfiles || []).map((d) => [d.id, d.stage_name]));
    residentDjs = (residentProfiles || []).map((p) => ({
      ...p,
      name: stageNameById.get(p.id) || p.display_name,
    }));
  }

  const genres = club?.sound_profile
    ? club.sound_profile.split(",").map((g) => g.trim()).filter(Boolean)
    : [];
  const socialLinks = SOCIAL_PLATFORMS.filter((p) => club?.[p.key]);

  const { data: galleryPhotos } = await supabase
    .from("profile_gallery")
    .select("id, url, width, height")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true });

  const { data: events } = await supabase
    .from("events")
    .select("id, title, cover_url, starts_at, city, venue_name, price_info")
    .eq("organizer_id", profile.id)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  const { data: reviewRows } = await supabase
    .from("profile_reviews")
    .select("id, reviewer_id, criteria, body, created_at")
    .eq("target_id", profile.id)
    .order("created_at", { ascending: false });

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

  let viewer = null;
  if (user && user.id !== profile.id) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, avatar_position")
      .eq("id", user.id)
      .maybeSingle();
    if (viewerProfile) {
      viewer = {
        name: viewerProfile.display_name,
        avatarUrl: viewerProfile.avatar_url,
        avatarPosition: viewerProfile.avatar_position,
      };
    }
  }

  const isOwner = user?.id === profile.id;

  const currentProfile = await getCurrentProfile();
  // Logged-out visitors still see the button (routed through login first);
  // logged-in fans don't, since messaging is DJ/club-to-DJ/club only.
  const canViewerMessage = !currentProfile || canUseMessaging(currentProfile.role);
  const messageTargetPath = `/${locale}/messages/new?with=${profile.id}`;
  const messageHref = currentProfile
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
            <h1 className="bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-3xl font-semibold tracking-tight text-transparent sm:text-4xl md:text-5xl xl:text-6xl">
              {club?.name || profile.display_name}
            </h1>

            {(club?.description || profile.bio) && (
              <p className="mt-4 w-full whitespace-pre-wrap text-left text-foreground-muted lg:max-w-md">
                {club?.description || profile.bio}
              </p>
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
              {club?.venue_type && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <BuildingIcon className="h-3.5 w-3.5" /> {tf.venue_type}
                  </dt>
                  <dd className="mt-1.5 font-medium">{club.venue_type}</dd>
                </div>
              )}
              {club?.genre && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <MusicNoteIcon className="h-3.5 w-3.5" /> {t.genre}
                  </dt>
                  <dd className="mt-1.5 font-medium">{club.genre}</dd>
                </div>
              )}
              {club?.location && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <MapPinIcon className="uppeh-3.5 w-3.5" /> {t.location}
                  </dt>
                  <dd className="mt-1.5 font-medium">{club.location}</dd>
                </div>
              )}
              {(residentDjs.length > 0 || residentCustomNames.length > 0) && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <MicIcon className="h-3.5 w-3.5" /> {tf.resident_djs}
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {residentDjs.map((dj) => (
                      <a
                        key={dj.id}
                        href={`/${locale}/djs/${encodeURIComponent(dj.display_name)}`}
                        className="uppercase flex items-center gap-2 rounded-full border border-border bg-background-elevated py-1 pl-1 pr-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                      >
                        {dj.avatar_url ? (
                          <Image
                            src={dj.avatar_url}
                            alt=""
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-semibold text-accent">
                            {dj.name.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        {dj.name}
                      </a>
                    ))}
                    {residentCustomNames.map((name) => (
                      <span
                        key={name}
                        className="flex items-center gap-2 rounded-full border border-dashed border-border py-1 px-3 text-sm font-medium text-foreground-muted"
                      >
                        {name}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {club?.capacity != null && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <UsersIcon className="h-3.5 w-3.5" /> {tf.capacity}
                  </dt>
                  <dd className="mt-1.5 font-medium">{club.capacity}</dd>
                </div>
              )}
              {club?.reservation_contact && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <PhoneIcon className="h-3.5 w-3.5" /> {tf.reservation_contact}
                  </dt>
                  <dd className="mt-1.5 font-medium">{club.reservation_contact}</dd>
                </div>
              )}
              {club?.website && (
                <div className="rounded-xl border border-border bg-background-elevated/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground-muted">
                    <GlobeIcon className="h-3.5 w-3.5" /> {t.website}
                  </dt>
                  <dd className="mt-1.5 font-medium">
                    <a href={club.website} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-2">
                      {club.website}
                    </a>
                  </dd>
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
                      href={club[key]}
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
              createEventHref={`/${locale}/events/create`}
              createEventLabel={dict.nav.addEvent}
            />
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
          <RatingSection
            targetId={profile.id}
            targetRole="club"
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
      </div>
    </div>
  );
}
