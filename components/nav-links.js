"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ locale, dict, isAdmin }) {
  const pathname = usePathname();

  const links = [
    { href: `/${locale}/djs`, label: dict.nav.djs },
    { href: `/${locale}/clubs`, label: dict.nav.clubs },
    { href: `/${locale}/events`, label: dict.nav.events },
    { href: `/${locale}/ranking`, label: dict.nav.ranking },
  ];

  function isActive(href) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="hidden items-center gap-8 text-sm font-medium text-foreground-muted md:flex">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`group relative uppercase font-bold after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 after:content-[''] ${
            isActive(link.href) ? "after:scale-x-100" : ""
          }`}
        >
          <span className="relative block h-[1em] overflow-hidden leading-none">
            <span className="flex flex-col leading-none transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:-translate-y-1/2">
              <span className={isActive(link.href) ? "text-accent" : "text-foreground"}>{link.label}</span>
              <span className="text-accent" aria-hidden="true">
                {link.label}
              </span>
            </span>
          </span>
        </Link>
      ))}
      {isAdmin && (
        <Link
          href={`/${locale}/admin`}
          className={`group relative uppercase font-bold after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-accent-2 after:transition-transform after:duration-300 after:content-[''] ${
            isActive(`/${locale}/admin`) ? "text-accent-2 after:scale-x-100" : ""
          }`}
        >
          <span className="relative block h-[1em] overflow-hidden leading-none">
            <span className="flex flex-col leading-none transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:-translate-y-1/2">
              <span className={isActive(`/${locale}/admin`) ? "text-accent-2" : "text-accent"}>{dict.nav.admin}</span>
              <span className="text-accent-2" aria-hidden="true">
                {dict.nav.admin}
              </span>
            </span>
          </span>
        </Link>
      )}
    </nav>
  );
}
