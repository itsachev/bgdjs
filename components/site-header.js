import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "./user-menu";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";
import { PresenceHeartbeat } from "./presence-heartbeat";
import { HeaderShrink } from "./header-shrink";
import { ScrollProgress } from "./scroll-progress";

// `profile` and `canMessage` come from the root layout (not computed here)
// so the same values also seed UnreadMessagesProvider up there — that
// provider has to wrap page content too, not just this header, for a page
// like an open message thread to be able to resync the badge below.
export function SiteHeader({ locale, dict, profile, canMessage }) {
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <PresenceHeartbeat userId={profile?.id ?? null} />
      <HeaderShrink>
        <Link href={`/${locale}`} className="font-display text-lg font-bold tracking-tight">
          BG<span className="text-accent">DJ</span>
          <span className="text-accent-2">.</span>
        </Link>

        <NavLinks locale={locale} dict={dict} isAdmin={isAdmin} />

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 nav:flex">
            <LocaleSwitcher locale={locale} />
            <ThemeToggle />
            {profile ? (
              <UserMenu
                profile={profile}
                logoutLabel={dict.nav.logout}
                locale={locale}
                addEventLabel={dict.nav.addEvent}
                canMessage={canMessage}
                accountLabel={dict.nav.myAccount}
                messagesLabel={dict.nav.messages}
                viewProfileLabel={dict.nav.viewProfile}
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
          <MobileNav locale={locale} dict={dict} isAdmin={isAdmin} profile={profile} canMessage={canMessage} />
        </div>
      </HeaderShrink>
      <ScrollProgress />
    </header>
  );
}
