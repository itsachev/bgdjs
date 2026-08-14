"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ locale, dict, isAdmin }) {
  const pathname = usePathname();

  const links = [
    { href: `/${locale}/djs`, label: dict.nav.djs },
    { href: `/${locale}/clubs`, label: dict.nav.clubs },
    { href: `/${locale}/events`, label: dict.nav.events },
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
          className={`relative uppercase font-bold transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:content-[''] ${
            isActive(link.href)
              ? "text-accent after:scale-x-100"
              : "text-white hover:text-foreground"
          }`}
        >
          {link.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href={`/${locale}/admin`}
          className={`relative uppercase font-bold transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-accent-2 after:transition-transform after:content-[''] ${
            isActive(`/${locale}/admin`) ? "text-accent-2 after:scale-x-100" : "text-accent hover:text-accent-2"
          }`}
        >
          {dict.nav.admin}
        </Link>
      )}
    </nav>
  );
}
