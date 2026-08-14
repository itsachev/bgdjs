import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "./user-menu";
import { NavLinks } from "./nav-links";

export async function SiteHeader({ locale, dict }) {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href={`/${locale}`} className="text-lg font-display font-semibold tracking-tight">
          BG<span className="text-accent">DJ</span>
        </Link>

        <NavLinks locale={locale} dict={dict} isAdmin={profile?.role === "admin"} />

        <div className="flex items-center gap-4">
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
          {profile ? (
            <UserMenu profile={profile} logoutLabel={dict.nav.logout} locale={locale} />
          ) : (
            <Link
              href={`/${locale}/login`}
              className="hidden rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent sm:inline-block"
            >
              {dict.nav.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
