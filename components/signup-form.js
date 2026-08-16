"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/password-input";
import { resolvePostAuthPath, isSafeNextPath } from "@/lib/post-auth-redirect";
import { AuthLayout } from "@/components/auth-layout";
import { MicIcon, BuildingIcon, HeartIcon, CheckIcon, CloseIcon, MailIcon } from "@/components/icons";

const DEBOUNCE_MS = 500;

const ROLE_ICONS = { dj: MicIcon, club: BuildingIcon, fan: HeartIcon };

function FieldStatus({ status, t }) {
  if (status === "checking") {
    return <p className="text-xs text-foreground-muted">{t.checking}</p>;
  }
  if (status === "available") {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium text-accent-2">
        <CheckIcon className="h-3.5 w-3.5" /> {t.available}
      </p>
    );
  }
  if (status === "taken") {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
        <CloseIcon className="h-3.5 w-3.5" /> {t.taken}
      </p>
    );
  }
  if (status === "error") {
    return <p className="text-xs text-foreground-muted">{t.checkFailed}</p>;
  }
  return null;
}

export function SignupForm({ dict, locale, embedded = false, background = null, next = null }) {
  const router = useRouter();
  const t = dict.auth.signup;
  const mediaUrl = background?.media_url;
  const mediaType = background?.media_type;
  const rootRef = useRef(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

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
      const path = isSafeNextPath(next) ? next : await resolvePostAuthPath(supabase, locale);
      setLoading(false);
      router.push(path);
      router.refresh();
      return;
    }

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    const content = (
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <MailIcon className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-display text-display-3 font-bold tracking-tight">{t.checkEmailTitle}</h1>
        <p className="mt-3 text-foreground-muted">{t.checkEmailBody}</p>
      </div>
    );

    if (embedded) return content;

    return (
      <AuthLayout
        locale={locale}
        mediaUrl={mediaUrl}
        mediaType={mediaType}
        kicker={t.heroKicker}
        title={t.heroTitle}
        benefits={t.benefits}
      >
        {content}
      </AuthLayout>
    );
  }

  const blockingSubmit =
    loading ||
    displayNameStatus === "checking" ||
    displayNameStatus === "taken" ||
    emailStatus === "checking" ||
    emailStatus === "taken";

  const formBody = (
    <>
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
            className="rounded-xl border border-border bg-background-elevated px-4 py-3 outline-none transition-colors focus:border-accent"
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
            className="rounded-xl border border-border bg-background-elevated px-4 py-3 outline-none transition-colors focus:border-accent"
          />
          <FieldStatus
            status={emailStatus}
            t={{ checking: t.checking, available: t.emailAvailable, taken: t.emailTaken, checkFailed: t.checkFailed }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-foreground-muted">
              {t.passwordPlaceholder} <span className="text-red-500">*</span>
            </label>
            <PasswordInput id="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
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
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm text-foreground-muted">
            {t.roleLabel} <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {ROLES.map((r) => {
              const Icon = ROLE_ICONS[r.value];
              const active = role === r.value;
              return (
                <label
                  key={r.value}
                  className={`group flex cursor-pointer flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all ${
                    active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-foreground-muted hover:border-accent/50 hover:text-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    required
                    value={r.value}
                    checked={active}
                    onChange={() => setRole(r.value)}
                    className="sr-only"
                  />
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-wide">{r.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={blockingSubmit}
          className="mt-2 w-full rounded-full bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_color-mix(in_oklch,var(--color-accent)_35%,transparent)] transition-transform disabled:opacity-60 disabled:shadow-none [@media(hover:hover)]:hover:not-disabled:scale-[1.02]"
        >
          {loading ? t.submitLoading : t.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        {t.haveAccount}{" "}
        <Link
          href={`/${locale}/login${isSafeNextPath(next) ? `?next=${encodeURIComponent(next)}` : ""}`}
          replace
          className="text-accent hover:text-accent-2"
        >
          {t.loginLink}
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
      benefits={t.benefits}
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
