"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AvatarUpload } from "@/components/avatar-upload";
import { BULGARIAN_CITIES } from "@/lib/bulgarian-cities";

// Genre names are kept in Latin script for both locales — these are used
// internationally as-is, including in the Bulgarian club scene.
const GENRE_CATEGORIES = [
  {
    label: "Electronic & Club",
    icon: "🎧",
    genres: ["House", "Commercial", "Trance", "Drum & Bass", "Dubstep", "EDM"],
  },
  {
    label: "Urban & Pop",
    icon: "🎤",
    genres: ["Hip-Hop / Rap", "R&B", "Pop", "Pop Folk", "Dancehall"],
  },
  {
    label: "Global & Tropical",
    icon: "🌴",
    genres: ["Afrobeats", "Amapiano", "Reggaeton", "Latin"],
  },
  {
    label: "Classics & Retro",
    icon: "🎸",
    genres: ["Disco", "Funk", "Soul", "Rock", "Reggae"],
  },
];

const FIELD_KEYS = {
  dj: [
    { key: "stage_name", type: "text", mandatory: true },
    { key: "gender", type: "pills", options: ["genderMan", "genderFemale"], mandatory: true },
    { key: "location", type: "select", mandatory: true },
    { key: "website", type: "text" },
    { key: "hourly_rate", type: "number" },
    { key: "social_links", type: "textarea" },
  ],
  club: [
    { key: "name", type: "text", mandatory: true },
    { key: "description", type: "textarea", mandatory: true },
    { key: "city", type: "text", mandatory: true },
    { key: "location", type: "select", mandatory: true },
    { key: "website", type: "text" },
    { key: "resident_dj", type: "text", mandatory: true },
    { key: "genre", type: "text", mandatory: true },
    { key: "capacity", type: "number", mandatory: true },
    { key: "reservation_contact", type: "text", mandatory: true },
    { key: "social_links", type: "textarea" },
  ],
};

export function ProfileCompleteForm({ role, locale, userId, profile, roleData, dict }) {
  const router = useRouter();
  const t = dict.profile.complete;
  const fields = FIELD_KEYS[role];
  const storageKey = `profile-draft:${userId}`;

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [values, setValues] = useState(() => {
    const initial = {};
    fields.forEach((f) => {
      initial[f.key] = roleData?.[f.key] ?? "";
    });
    return initial;
  });
  const [selectedGenres, setSelectedGenres] = useState(() =>
    roleData?.sound_profile ? roleData.sound_profile.split(",").map((g) => g.trim()).filter(Boolean) : []
  );
  const [hasRoleRow] = useState(Boolean(roleData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Gates the persist effect below so it can never fire with the pre-draft
  // (empty) state and clobber the saved draft before it's been restored.
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Restore any unsaved draft after a refresh.
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const draft = JSON.parse(raw);
        if (typeof draft.displayName === "string") setDisplayName(draft.displayName);
        if (typeof draft.bio === "string") setBio(draft.bio);
        if (draft.values) setValues((v) => ({ ...v, ...draft.values }));
        if (Array.isArray(draft.selectedGenres)) setSelectedGenres(draft.selectedGenres);
      } catch {
        // ignore corrupt draft
      }
    }
    setDraftLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Keep the draft in sync as the user types/selects.
  useEffect(() => {
    if (!draftLoaded) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({ displayName, bio, values, selectedGenres })
    );
  }, [draftLoaded, storageKey, displayName, bio, values, selectedGenres]);

  function setValue(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function toggleGenre(genre) {
    setSelectedGenres((current) =>
      current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre]
    );
  }

  const avatarRequired = role === "dj";
  const missingAvatar = avatarRequired && !avatarUrl;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (missingAvatar) {
      setError(t.errorPhoto);
      return;
    }
    if (selectedGenres.length === 0) {
      setError(t.errorGenre);
      return;
    }
    const missingPillField = fields.find((f) => f.type === "pills" && f.mandatory && !values[f.key]);
    if (missingPillField) {
      setError(t.errorRequired);
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio: bio || null })
      .eq("id", userId);

    if (profileError) {
      setSaving(false);
      setError(profileError.message);
      return;
    }

    const payload = { sound_profile: selectedGenres.join(", ") };
    fields.forEach((f) => {
      if (f.type === "number") {
        payload[f.key] = values[f.key] === "" ? null : Number(values[f.key]);
      } else {
        payload[f.key] = values[f.key] || null;
      }
    });

    const table = role === "dj" ? "dj_profiles" : "club_profiles";
    const { error: roleError } = hasRoleRow
      ? await supabase.from(table).update(payload).eq("id", userId)
      : await supabase.from(table).insert({ id: userId, ...payload });

    setSaving(false);
    if (roleError) {
      setError(roleError.message);
      return;
    }

    localStorage.removeItem(storageKey);
    router.push(`/${locale}/${role === "dj" ? "djs" : "clubs"}/${encodeURIComponent(displayName)}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          {t.title}
        </h1>
        <p className="mt-6 text-sm text-foreground-muted">
          {role === "dj" ? t.subtitleDj : t.subtitleClub}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <AvatarUpload userId={userId} initialUrl={avatarUrl} onChange={setAvatarUrl} t={t} />
        {avatarRequired && !avatarUrl && (
          <p className="text-sm text-foreground-muted">
            {t.photoLabel} <span className="text-red-500">*</span> {t.photoRequired}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground-muted" htmlFor="displayName">
            {t.usernameLabel} <span className="text-red-500">*</span>
          </label>
          <input
            id="displayName"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>

        {role === "dj" && (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-foreground-muted">
              {t.fields.gender} <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {["genderMan", "genderFemale"].map((optionKey) => {
                const optionValue = t.fields[optionKey];
                const selected = values.gender === optionValue;
                return (
                  <button
                    key={optionKey}
                    type="button"
                    onClick={() => setValue("gender", selected ? "" : optionValue)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? "border-transparent bg-accent text-white"
                        : "border-border text-foreground-muted hover:text-foreground"
                    }`}
                  >
                    {optionValue}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-sm text-foreground-muted" htmlFor="bio">
            {t.bioLabel} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="bio"
            rows={3}
            required
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>

        {fields
          .filter((f) => f.key !== "gender")
          .map((f) => (
          <div
            key={f.key}
            className={`flex flex-col gap-1.5 ${f.type === "textarea" ? "md:col-span-2" : ""}`}
          >
            <label className="text-sm text-foreground-muted" htmlFor={f.key}>
              {t.fields[f.key]} {f.mandatory && <span className="text-red-500">*</span>}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={f.key}
                rows={3}
                required={f.mandatory}
                value={values[f.key]}
                onChange={(e) => setValue(f.key, e.target.value)}
                placeholder={f.key === "social_links" ? t.fields.social_links_hint : undefined}
                className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
              />
            ) : f.type === "pills" ? (
              <div className="flex flex-wrap gap-2">
                {f.options.map((optionKey) => {
                  const optionValue = t.fields[optionKey];
                  const selected = values[f.key] === optionValue;
                  return (
                    <button
                      key={optionKey}
                      type="button"
                      onClick={() => setValue(f.key, selected ? "" : optionValue)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        selected
                          ? "border-transparent bg-accent text-white"
                          : "border-border text-foreground-muted hover:text-foreground"
                      }`}
                    >
                      {optionValue}
                    </button>
                  );
                })}
              </div>
            ) : f.type === "select" ? (
              <select
                id={f.key}
                required={f.mandatory}
                value={values[f.key]}
                onChange={(e) => setValue(f.key, e.target.value)}
                className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
              >
                <option value="">{t.selectCity}</option>
                {BULGARIAN_CITIES.map((city) => (
                  <option key={city.value} value={city.value}>
                    {city[locale] ?? city.en}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={f.key}
                type={f.type === "number" ? "number" : "text"}
                required={f.mandatory}
                value={values[f.key]}
                onChange={(e) => setValue(f.key, e.target.value)}
                className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <p className="text-sm text-foreground-muted">
          {t.soundProfileLabel} <span className="text-red-500">*</span> — {t.soundProfileHint}
        </p>
        {GENRE_CATEGORIES.map((category) => (
          <div key={category.label} className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              <span aria-hidden="true">{category.icon}</span> {category.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {category.genres.map((genre) => {
                const selected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? "border-transparent bg-accent text-white"
                        : "border-border text-foreground-muted hover:text-foreground"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {saving ? t.saving : t.save}
      </button>
    </form>
  );
}
