import Link from "next/link";
import Image from "next/image";
import { Kicker } from "@/components/kicker";
import { CrownIcon } from "@/components/icons";

export function RankingTeaser({ kicker, title, viewAllLabel, votesLabel, locale, items }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <div className="rounded-3xl border border-border bg-background-elevated/40 p-8 sm:p-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Kicker>{kicker}</Kicker>
            <h2 className="mt-3 font-display text-display-2 font-bold tracking-tight">{title}</h2>
          </div>
          <Link
            href={`/${locale}/ranking`}
            className="text-sm font-semibold text-accent transition-colors hover:text-accent-2"
          >
            {viewAllLabel} →
          </Link>
        </div>

        <ol className="mt-10 flex flex-col gap-3">
          {items.map((entity, i) => (
            <li key={entity.id}>
              <Link
                href={`/${locale}/djs/${encodeURIComponent(entity.displayName)}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:border-accent"
              >
                <span className="w-6 font-display text-lg font-bold text-foreground-muted">{i + 1}</span>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-background-elevated">
                  {entity.avatarUrl ? (
                    <Image
                      src={entity.avatarUrl}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                      style={{ objectPosition: entity.avatarPosition || "50% 50%" }}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-xs font-semibold text-accent">
                      {entity.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="flex-1 truncate font-semibold tracking-tight transition-colors group-hover:text-accent">
                  {entity.name}
                </span>
                {i === 0 && <CrownIcon className="h-4 w-4 shrink-0 text-yellow-400" />}
                <span className="shrink-0 text-sm text-foreground-muted">
                  {entity.votes} {votesLabel}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
