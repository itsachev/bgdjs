"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/password-input";
import { resolvePostAuthPath } from "@/lib/post-auth-redirect";

const DEBOUNCE_MS = 500;

function FieldStatus({ status, t }) {
  if (status === "checking") {
    return <p className="text-sm text-foreground-muted">{t.checking}</p>;
  }
  if (status === "available") {
    return <p className="text-sm text-accent-2">{t.available}</p>;
  }
  if (status === "taken") {
    return <p className="text-sm text-red-500">{t.taken}</p>;
  }
  if (status === "error") {
    return <p className="text-sm text-foreground-muted">{t.checkFailed}</p>;
  }
  return null;
}

export function SignupForm({ dict, locale }) {
  const router = useRouter();
  const t = dict.auth.signup;
  const ROLES = [
    { value: "dj", label: t.roleDj },
    { value: "club", label: t.roleClub },
    { value: "fan", label: t.roleFan },
  ];

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("dj");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [displayNameStatus, setDisplayNameStatus] = useState("idle");
  const [emailStatus, setEmailStatus] = useState("idle");

  useEffect(() => {
    const name = displayName.trim();
    if (name.length < 2) {
      setDisplayNameStatus("idle");
      return;
    }

    setDisplayNameStatus("checking");
    let cancelled = false;
    const supabase = createClient();

    const timeout = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("display_name", name)
        .maybeSingle();

      if (cancelled) return;
      setDisplayNameStatus(error ? "error" : data ? "taken" : "available");
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [displayName]);

  useEffect(() => {
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setEmailStatus("idle");
      return;
    }

    setEmailStatus("checking");
    let cancelled = false;
    const supabase = createClient();

    const timeout = setTimeout(async () => {
      const { data, error } = await supabase.rpc("email_exists", { check_email: value });

      if (cancelled) return;
      setEmailStatus(error ? "error" : data ? "taken" : "available");
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [email]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }
    if (displayNameStatus === "taken") {
      setError(t.displayNameTaken);
      return;
    }
    if (emailStatus === "taken") {
      setError(t.emailTaken);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, role },
      },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    if (data.session) {
      const path = await resolvePostAuthPath(supabase, locale);
      setLoading(false);
      router.push(path);
      router.refresh();
      return;
    }

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-sm flex-col px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t.checkEmailTitle}</h1>
        <p className="mt-3 text-foreground-muted">{t.checkEmailBody}</p>
      </div>
    );
  }

  const blockingSubmit =
    loading ||
    displayNameStatus === "checking" ||
    displayNameStatus === "taken" ||
    emailStatus === "checking" ||
    emailStatus === "taken";

  return (
    <div className="mx-auto flex max-w-sm flex-col px-6 py-24">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{t.title}</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="displayName" className="text-sm text-foreground-muted">
            {t.displayNamePlaceholder} <span className="text-red-500">*</span>
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
          />
          <FieldStatus
            status={displayNameStatus}
            t={{ checking: t.checking, available: t.displayNameAvailable, taken: t.displayNameTaken, checkFailed: t.checkFailed }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-foreground-muted">
            {t.emailPlaceholder} <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
          />
          <FieldStatus
            status={emailStatus}
            t={{ checking: t.checking, available: t.emailAvailable, taken: t.emailTaken, checkFailed: t.checkFailed }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm text-foreground-muted">
            {t.passwordPlaceholder} <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            id="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm text-foreground-muted">
            {t.confirmPasswordPlaceholder} <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            id="confirmPassword"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm text-foreground-muted">
            {t.roleLabel} <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium transition-all ${
                  role === r.value
                    ? "border-transparent bg-accent text-white"
                    : "border-border text-foreground-muted hover:text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  required
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={blockingSubmit}
          className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {loading ? t.submitLoading : t.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        {t.haveAccount}{" "}
        <Link href={`/${locale}/login`} className="text-accent hover:text-accent-2">
          {t.loginLink}
        </Link>
      </p>
    </div>
  );
}
