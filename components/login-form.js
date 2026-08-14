"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { resolvePostAuthPath } from "@/lib/post-auth-redirect";
import { Waveform } from "@/components/waveform";

export function LoginForm({ dict, locale, embedded = false, background = null }) {
  const t = dict.auth.login;
  const router = useRouter();
  const mediaUrl = background?.media_url;
  const mediaType = background?.media_type;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

    const path = await resolvePostAuthPath(supabase, locale);
    setLoading(false);
    router.push(path);
    router.refresh();
  }

  const formBody = (
    <>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <input
          type="email"
          required
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          placeholder={t.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {loading ? t.submitLoading : t.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        {t.noAccount}{" "}
        <Link href={`/${locale}/signup`} replace className="text-accent hover:text-accent-2">
          {t.signupLink}
        </Link>
      </p>
    </>
  );

  if (embedded) {
    return (
      <div className="flex flex-col">
        <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight">{t.title}</h1>
        {formBody}
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {mediaUrl ? (
          <>
            {mediaType === "video" ? (
              <video
                src={mediaUrl}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <Image src={mediaUrl} alt="" fill sizes="100vw" preload className="object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/85 to-background" />
          </>
        ) : (
          <>
            <div className="absolute -top-40 left-[8%] h-112 w-md rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_38%,transparent),transparent_70%)] blur-3xl" />
            <div className="absolute top-1/3 -right-32 h-128 w-lg rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_32%,transparent),transparent_70%)] blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-72 w-full max-w-4xl -translate-x-1/2 opacity-[0.15]">
              <Waveform className="h-full w-full justify-center" />
            </div>
          </>
        )}
      </div>

      <div className="relative mx-auto flex max-w-2xl flex-col px-6 py-24">
        <h1 className="bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
          {t.title}
        </h1>
        {formBody}
      </div>
    </div>
  );
}
