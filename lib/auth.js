import "server-only";
import { createClient } from "./supabase/server";

// Roles: "fan" | "dj" | "club" | "admin"
export async function getCurrentProfile() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", user.id)
    .single();

  return profile ? { ...profile, email: user.email } : null;
}

export async function isAdmin() {
  const profile = await getCurrentProfile();
  return profile?.role === "admin";
}
