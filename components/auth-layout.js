import Link from "next/link";
import Image from "next/image";
import { Waveform } from "@/components/waveform";
import { GradientMask } from "@/components/gradient-mask";

// Shared split-screen shell for the login/signup pages — a full-height brand
// panel (CMS media when set, otherwise an ambient glow + waveform) alongside
// the actual form. Kept content-agnostic so each form supplies its own copy.
export function AuthLayout({
  locale,
  mediaUrl,
  mediaType,
  kicker,
  title,
  subtitle,
  benefits,
  imageMaskDirection,
  children,
}) {
  return (
    <div className="relative flex min-h-screen flex-1">
      <div className="relative hidden w-[44%] shrink-0 overflow-hidden lg:block">
        <div aria-hidden="true" className="absolute inset-0">
          {mediaUrl ? (
            <>
              {mediaType === "video" ? (
                <video src={mediaUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />
              ) : imageMaskDirection ? (
                <GradientMask direction={imageMaskDirection} className="h-full w-full">
                  <Image src={mediaUrl} alt="" fill sizes="44vw" className="object-cover" />
                </GradientMask>
              ) : (
                <Image src={mediaUrl} alt="" fill sizes="44vw" className="object-cover" />
              )}
              {/* Fixed dark scrim regardless of site theme — the panel copy below is always light. */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/45 to-black/70" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[#07060a]" />
              <div className="absolute -top-32 left-[10%] h-125 w-125 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_35%,transparent),transparent_70%)] blur-3xl" />
              <div className="absolute -bottom-24 right-[5%] h-96 w-96 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_30%,transparent),transparent_70%)] blur-3xl" />
              <div className="absolute inset-x-0 bottom-20 px-16 opacity-40">
                <Waveform className="h-14 w-full justify-center" />
              </div>
            </>
          )}
        </div>

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href={`/${locale}`} className="font-display text-xl font-bold tracking-tight">
            BG<span className="text-accent-2">DJ</span>.
          </Link>

          <div>
            <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-accent-2">
              <span className="h-px w-6 bg-current" aria-hidden="true" />
              {kicker}
            </p>
            <h1 className="mt-4 max-w-sm text-balance font-display text-display-2 font-bold tracking-tight">
              {title}
            </h1>
            {subtitle && <p className="mt-4 max-w-sm text-white/70">{subtitle}</p>}
            {benefits && (
              <ul className="mt-8 flex flex-col gap-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-white/80">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-2" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Bulgarian DJ Community</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-16 sm:py-24">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
