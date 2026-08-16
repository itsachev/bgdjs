"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resolvePostAuthPath, isSafeNextPath } from "@/lib/post-auth-redirect";
import { AuthLayout } from "@/components/auth-layout";

export function LoginForm({ dict, locale, embedded = false, background = null, next = null }) {
  const t = dict.auth.login;
  const router = useRouter();
  const mediaUrl = background?.media_url;
  const mediaType = background?.media_type;
  const rootRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (embedded) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set("[data-auth-reveal]", { opacity: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "power3.out" } }).to("[data-auth-reveal]", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
      });
    }, rootRef);
    return () => ctx.revert();
  }, [embedded]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const path = isSafeNextPath(next) ? next : await resolvePostAuthPath(supabase, locale);
    setLoading(false);
    router.push(path);
    router.refresh();
  }

  const formBody = (
    <>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-border bg-background-elevated px-4 py-3 outline-none transition-colors focus:border-accent"
        />
        <input
          type="password"
          required
          placeholder={t.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-border bg-background-elevated px-4 py-3 outline-none transition-colors focus:border-accent"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-full bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_color-mix(in_oklch,var(--color-accent)_35%,transparent)] transition-transform disabled:opacity-60 disabled:shadow-none [@media(hover:hover)]:hover:not-disabled:scale-[1.02]"
        >
          {loading ? t.submitLoading : t.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        {t.noAccount}{" "}
        <Link
          href={`/${locale}/signup${isSafeNextPath(next) ? `?next=${encodeURIComponent(next)}` : ""}`}
          replace
          className="text-accent hover:text-accent-2"
        >
          {t.signupLink}
        </Link>
      </p>
    </>
  );

  if (embedded) {
    return (
      <div className="flex flex-col">
        <h1 className="font-display text-display-3 font-bold tracking-tight">{t.title}</h1>
        {formBody}
      </div>
    );
  }

  return (
    <AuthLayout
      locale={locale}
      mediaUrl={mediaUrl}
      mediaType={mediaType}
      kicker={t.heroKicker}
      title={t.heroTitle}
      subtitle={t.heroSubtitle}
      imageMaskDirection="right"
    >
      <div ref={rootRef}>
        <h1 data-auth-reveal className="translate-y-3 font-display text-display-3 font-bold tracking-tight opacity-0">
          {t.title}
        </h1>
        <div data-auth-reveal className="translate-y-3 opacity-0">
          {formBody}
        </div>
      </div>
    </AuthLayout>
  );
}
