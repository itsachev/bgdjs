"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { createClient } from "@/lib/supabase/client";
import { PlusIcon, MessageIcon } from "@/components/icons";
import { useUnreadMessages } from "./unread-messages-provider";

// `accountLabel` swaps the trigger text from the raw display name to a
// generic "My account" label — both the desktop header and mobile panel
// pass it. Only the desktop header additionally passes `addEventLabel`,
// which is what turns the trigger into a hover dropdown (gathering
// profile/messages/add-event links); see the `hasDropdown` comment below
// for why the mobile panel deliberately doesn't get one.
export function UserMenu({
  profile,
  logoutLabel,
  locale,
  addEventLabel,
  canMessage,
  accountLabel,
  messagesLabel,
  viewProfileLabel,
}) {
  const router = useRouter();
  const { count: unreadCount } = useUnreadMessages();
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

  const nameClassName = "relative uppercase hidden text-sm font-medium transition-colors hover:text-accent sm:inline-block";
  const itemClassName =
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-accent/10 hover:text-accent";

  // Only the desktop header passes `addEventLabel`, so it alone decides
  // whether the hover dropdown is rendered — the mobile panel never gets
  // one, since onMouseEnter/onMouseLeave never fire on a touchscreen and
  // would strand dj/club users unable to tap through to their profile.
  const hasDropdown = Boolean(addEventLabel);

  return (
    <div className="flex items-center gap-3">
      {hasDropdown ? (
        <div className="relative hidden sm:block" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
          <span className={`${nameClassName} text-white`}>
            {accountLabel}
            {canMessage && unreadCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-2 px-1 text-[0.6rem] font-bold text-black">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>

          <div
            ref={menuRef}
            style={{ opacity: 0, transform: "translateY(-8px)" }}
            className={`absolute right-0 top-full z-50 w-52 pt-3 ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <div className="overflow-hidden rounded-xl border border-border bg-background-elevated p-1.5 shadow-2xl">
              {profileHref && (
                <Link href={profileHref} className={itemClassName}>
                  {viewProfileLabel}
                </Link>
              )}
              {canMessage && (
                <Link href={`/${locale}/messages`} className={itemClassName}>
                  <MessageIcon className="h-4 w-4" />
                  {messagesLabel}
                  {unreadCount > 0 && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-2 px-1 text-[0.6rem] font-bold text-black">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}
              <Link href={`/${locale}/events/create`} className={itemClassName}>
                <PlusIcon className="h-4 w-4" />
                {addEventLabel}
              </Link>
            </div>
          </div>
        </div>
      ) : profileHref ? (
        <Link href={profileHref} className={nameClassName}>
          {accountLabel}
        </Link>
      ) : (
        <span className={`${nameClassName} text-white`}>{accountLabel}</span>
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
