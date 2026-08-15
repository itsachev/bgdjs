"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function MobileNav({ locale, dict, isAdmin, profile }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);

  // The panel is portaled to <body> — the header's backdrop-blur makes it establish a new
  // containing block for `position: fixed` descendants, which collapses a nested fixed panel
  // to zero height. document.body isn't available during SSR, hence the mount gate.
  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { href: `/${locale}/djs`, label: dict.nav.djs },
    { href: `/${locale}/clubs`, label: dict.nav.clubs },
    { href: `/${locale}/events`, label: dict.nav.events },
  ];
  if (isAdmin) {
    links.push({ href: `/${locale}/admin`, label: dict.nav.admin, admin: true });
  }
  if (profile) {
    links.push({ href: `/${locale}/events/create`, label: dict.nav.addEvent });
  }

  function isActive(href) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // One-shot stagger, fired fresh each time the panel opens — visibility itself is handled
  // by plain CSS classes below, so this only ever has to animate content that's already shown.
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const items = panelRef.current.querySelectorAll("[data-mobile-link]");
    gsap.fromTo(
      items,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power3.out", delay: 0.15 }
    );
  }, [open]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="relative z-50 flex h-9 w-9 shrink-0 items-center justify-center md:hidden"
      >
        <span className="relative block h-4 w-5">
          <span
            className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-foreground transition-transform duration-300 ease-in-out ${
              open ? "translate-y-1.75 rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-1.75 h-0.5 w-5 rounded-full bg-foreground transition-opacity duration-200 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 top-3.5 h-0.5 w-5 rounded-full bg-foreground transition-transform duration-300 ease-in-out ${
              open ? "-translate-y-1.75 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {mounted &&
        createPortal(
          <div
            ref={panelRef}
            className={`fixed inset-x-0 top-16 bottom-0 z-40 origin-top overflow-y-auto bg-background/98 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] md:hidden ${
              open ? "pointer-events-auto scale-y-100 opacity-100" : "pointer-events-none scale-y-0 opacity-0"
            }`}
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -right-24 -top-12 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent-2/20 blur-3xl" />
            </div>

            <nav className="flex min-h-full flex-col items-center justify-center gap-7 px-6 py-16">
              {links.map((link) => (
                <Link
                  key={link.href}
                  data-mobile-link
                  href={link.href}
                  className={`font-display text-3xl font-bold uppercase tracking-tight ${
                    isActive(link.href) ? (link.admin ? "text-accent-2" : "text-accent") : "text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div
                data-mobile-link
                className="mt-6 flex flex-col items-center gap-6 border-t border-border/60 pt-8"
              >
                <LocaleSwitcher locale={locale} />
                <ThemeToggle />
                {profile ? (
                  <UserMenu profile={profile} logoutLabel={dict.nav.logout} locale={locale} />
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/${locale}/login`}
                      className="rounded-full border border-border px-4 py-1.5 text-sm font-bold uppercase transition-colors hover:border-accent hover:text-accent"
                    >
                      {dict.nav.login}
                    </Link>
                    <Link
                      href={`/${locale}/signup`}
                      className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold uppercase text-white transition-opacity hover:opacity-90"
                    >
                      {dict.nav.signup}
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>,
          document.body
        )}
    </div>
  );
}
