"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resolvePostAuthPath } from "@/lib/post-auth-redirect";

export function LoginForm({ dict, locale }) {
  const t = dict.auth.login;
  const router = useRouter();
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

  return (
    <div className="mx-auto flex max-w-sm flex-col px-6 py-24">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{t.title}</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
        <Link href={`/${locale}/signup`} className="text-accent hover:text-accent-2">
          {t.signupLink}
        </Link>
      </p>
    </div>
  );
}
