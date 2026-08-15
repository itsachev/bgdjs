import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../../dictionaries";
import { ProfileCompleteForm } from "@/components/profile-complete-form";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return {
    title: dict.profile.complete.title,
    robots: { index: false, follow: false },
  };
}

export default async function ProfileCompletePage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, avatar_url, avatar_position, bio")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "dj" && profile.role !== "club")) {
    redirect(`/${locale}`);
  }

  const table = profile.role === "dj" ? "dj_profiles" : "club_profiles";
  const { data: roleData } = await supabase.from(table).select("*").eq("id", user.id).maybeSingle();
  const { data: galleryPhotos } = await supabase
    .from("profile_gallery")
    .select("id, url, path, width, height")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <ProfileCompleteForm
      role={profile.role}
      locale={locale}
      userId={user.id}
      profile={profile}
      roleData={roleData}
      galleryPhotos={galleryPhotos || []}
      dict={dict}
    />
  );
}
