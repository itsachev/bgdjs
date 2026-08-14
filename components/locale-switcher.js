"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const locales = ["bg", "en"];

export function LocaleSwitcher({ locale }) {
  const pathname = usePathname();
  const segments = pathname.split("/");

  return (
    <div className="flex items-center gap-1 text-sm font-medium uppercase tracking-wide">
      {locales.map((loc, i) => {
        const nextSegments = [...segments];
        nextSegments[1] = loc;
        const href = nextSegments.join("/") || "/";

        return (
          <span key={loc} className="flex items-center gap-1">
            <Link
              href={href}
              className={
                loc === locale
                  ? "text-accent"
                  : "text-foreground-muted transition-colors hover:text-foreground"
              }
            >
              {loc}
            </Link>
            {i < locales.length - 1 && (
              <span className="text-foreground-muted">/</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
