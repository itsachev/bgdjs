"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { createClient } from "@/lib/supabase/client";
import { PlusIcon } from "@/components/icons";

// `addEventLabel` gates the hover dropdown entirely — the desktop header
// passes it, the mobile panel doesn't (it already lists "Add event" among
// the main nav links there instead, since hover has no touch equivalent).
export function UserMenu({ profile, logoutLabel, locale, addEventLabel }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    if (!menuRef.current) return;
    if (menuOpen) {
      gsap.to(menuRef.current, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power3.out" });
    } else {
      gsap.to(menuRef.current, { autoAlpha: 0, y: -8, duration: 0.2, ease: "power3.in" });
    }
  }, [menuOpen]);

  function openMenu() {
    clearTimeout(closeTimer.current);
    setMenuOpen(true);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 150);
  }

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  }

  const profileHref =
    profile.role === "dj"
      ? `/${locale}/djs/${encodeURIComponent(profile.display_name)}`
      : profile.role === "club"
        ? `/${locale}/clubs/${encodeURIComponent(profile.display_name)}`
        : null;

  const nameClassName = "uppercase hidden text-sm font-medium transition-colors hover:text-accent sm:inline-block";

  return (
    <div className="flex items-center gap-3">
      {addEventLabel ? (
        <div className="relative hidden sm:block" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
          {profileHref ? (
            <Link href={profileHref} className={nameClassName}>
              {profile.display_name}
            </Link>
          ) : (
            <span className={`${nameClassName} text-white`}>{profile.display_name}</span>
          )}

          <div
            ref={menuRef}
            style={{ opacity: 0, transform: "translateY(-8px)" }}
            className={`absolute right-0 top-full z-50 w-52 pt-3 ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <div className="overflow-hidden rounded-xl border border-border bg-background-elevated p-1.5 shadow-2xl">
              <Link
                href={`/${locale}/events/create`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-accent/10 hover:text-accent"
              >
                <PlusIcon className="h-4 w-4" />
                {addEventLabel}
              </Link>
            </div>
          </div>
        </div>
      ) : profileHref ? (
        <Link href={profileHref} className={nameClassName}>
          {profile.display_name}
        </Link>
      ) : (
        <span className={`${nameClassName} text-white`}>{profile.display_name}</span>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold uppercase text-white  transition-colors"
      >
        {logoutLabel}
      </button>
    </div>
  );
}
