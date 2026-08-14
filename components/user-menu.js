"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function UserMenu({ profile, logoutLabel, locale }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  const profileHref =
    profile.role === "dj"
      ? `/${locale}/djs/${encodeURIComponent(profile.display_name)}`
      : profile.role === "club"
        ? `/${locale}/clubs/${encodeURIComponent(profile.display_name)}`
        : null;

  return (
    <div className="flex items-center gap-3">
      {profileHref ? (
        <Link
          href={profileHref}
          className="hidden text-sm font-medium transition-colors hover:text-accent sm:inline-block"
        >
          {profile.display_name}
        </Link>
      ) : (
        <span className="hidden text-sm font-medium sm:inline-block">{profile.display_name}</span>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
      >
        {logoutLabel}
      </button>
    </div>
  );
}
