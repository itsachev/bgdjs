"use client";

// Open-redirect guard for a `?next=` deep link (e.g. the "Message" button's
// login round-trip): only a same-site path is honored — a bare "//host"
// protocol-relative URL or an absolute URL falls back to the normal
// post-auth resolution below instead.
export function isSafeNextPath(next) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//");
}

// Decides where to send a user right after sign-in/sign-up: DJs and clubs
// with an incomplete profile are sent to /profile/complete instead of home.
export async function resolvePostAuthPath(supabase, locale) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return `/${locale}`;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) return `/${locale}`;

  if (profile.role === "dj") {
    const { data: djProfile } = await supabase
      .from("dj_profiles")
      .select("sound_profile")
      .eq("id", user.id)
      .maybeSingle();

    const complete = Boolean(profile.avatar_url) && Boolean(djProfile?.sound_profile);
    if (!complete) return `/${locale}/profile/complete`;
  }

  if (profile.role === "club") {
    const { data: clubProfile } = await supabase
      .from("club_profiles")
      .select("sound_profile")
      .eq("id", user.id)
      .maybeSingle();

    if (!clubProfile?.sound_profile) return `/${locale}/profile/complete`;
  }

  return `/${locale}`;
}
