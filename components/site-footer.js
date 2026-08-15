import Link from "next/link";

export function SiteFooter({ dict, locale }) {
  const year = new Date().getFullYear();

  const exploreLinks = [
    { href: `/${locale}/djs`, label: dict.nav.djs },
    { href: `/${locale}/clubs`, label: dict.nav.clubs },
    { href: `/${locale}/events`, label: dict.nav.events },
    { href: `/${locale}/ranking`, label: dict.nav.ranking },
  ];

  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-12 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Link href={`/${locale}`} className="font-display text-2xl font-bold tracking-tight">
              BG<span className="text-accent">DJ</span>
              <span className="text-accent-2">.</span>
            </Link>
            <p className="mt-4 text-sm text-foreground-muted">{dict.footer.tagline}</p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground-muted">
                {dict.footer.exploreTitle}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {exploreLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-foreground transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground-muted">
                {dict.footer.joinTitle}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                <li>
                  <Link
                    href={`/${locale}/signup`}
                    className="text-sm font-medium text-foreground transition-colors hover:text-accent"
                  >
                    {dict.nav.signup}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/login`}
                    className="text-sm font-medium text-foreground transition-colors hover:text-accent"
                  >
                    {dict.nav.login}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 text-center text-xs text-foreground-muted sm:flex-row sm:text-left">
          <p>
            &copy; {year} Bulgarian DJ Community. {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
