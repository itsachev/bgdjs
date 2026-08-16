import "server-only";
import { cache } from "react";
import { createClient, getAuthUser } from "./supabase/server";

// Roles: "fan" | "dj" | "club" | "admin"
// Memoized per request (see getAuthUser) since the layout and the page
// rendering under it both call this for the same navigation.
export const getCurrentProfile = cache(async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", user.id)
    .single();

  return profile ? { ...profile, email: user.email } : null;
});

export async function isAdmin() {
  const profile = await getCurrentProfile();
  return profile?.role === "admin";
}

// Single gate for messaging eligibility. Today it's role-only — any DJ or
// club can message any other DJ or club, for free. When messaging becomes a
// paid feature, this is the one place to add the tier check (e.g.
// `&& profile.tier !== "free"` once profiles carry a tier/subscription
// field) — every entry point (the profile "Message" button, the inbox page,
// the thread's compose box, and /messages/new's server-side validation) all
// call this same function rather than re-implementing the rule.
export function canUseMessaging(role) {
  return role === "dj" || role === "club";
}
