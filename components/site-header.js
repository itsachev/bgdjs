import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "./user-menu";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";
import { PresenceHeartbeat } from "./presence-heartbeat";

export async function SiteHeader({ locale, dict }) {
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <PresenceHeartbeat userId={profile?.id ?? null} />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href={`/${locale}`} className="text-lg font-display font-semibold tracking-tight">
          BG<span className="text-accent">DJ</span>
        </Link>

        <NavLinks locale={locale} dict={dict} isAdmin={isAdmin} />

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
            <LocaleSwitcher locale={locale} />
            <ThemeToggle />
            {profile ? (
              <UserMenu
                profile={profile}
                logoutLabel={dict.nav.logout}
                locale={locale}
                addEventLabel={dict.nav.addEvent}
              />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/login`}
                  className="uppercase font-bold rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
                >
                  {dict.nav.login}
                </Link>
                <Link
                  href={`/${locale}/signup`}
                  className="uppercase font-bold rounded-full bg-accent px-4 py-1.5 text-sm text-white transition-opacity hover:opacity-90"
                >
                  {dict.nav.signup}
                </Link>
              </div>
            )}
          </div>
          <MobileNav locale={locale} dict={dict} isAdmin={isAdmin} profile={profile} />
        </div>
      </div>
    </header>
  );
}
