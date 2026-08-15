"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AvatarUpload } from "@/components/avatar-upload";
import { ResidentDjPicker } from "@/components/resident-dj-picker";
import { GalleryEditor } from "@/components/gallery-editor";
import { MixEditor } from "@/components/mix-editor";
import { BULGARIAN_CITIES } from "@/lib/bulgarian-cities";
import {
  InstagramIcon,
  FacebookIcon,
  TiktokIcon,
  SoundcloudIcon,
  MixcloudIcon,
  YoutubeIcon,
} from "@/components/icons";

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

const SOCIAL_FIELDS = [
  { key: "instagram_url", type: "text", icon: InstagramIcon, color: "text-pink-500" },
  { key: "facebook_url", type: "text", icon: FacebookIcon, color: "text-blue-600" },
  { key: "tiktok_url", type: "text", icon: TiktokIcon, color: "text-rose-500" },
  { key: "soundcloud_url", type: "text", icon: SoundcloudIcon, color: "text-orange-500" },
  { key: "mixcloud_url", type: "text", icon: MixcloudIcon, color: "text-sky-500" },
  { key: "youtube_url", type: "text", icon: YoutubeIcon, color: "text-red-600" },
];

const FIELD_KEYS = {
  dj: [
    { key: "stage_name", type: "text", mandatory: true },
    { key: "gender", type: "pills", options: ["genderMan", "genderFemale"], mandatory: true },
    { key: "location", type: "select", mandatory: true },
    { key: "website", type: "text" },
    { key: "years_active", type: "number" },
  ],
  club: [
    { key: "name", type: "text", mandatory: true },
    { key: "description", type: "textarea", mandatory: true },
    {
      key: "venue_type",
      type: "pills",
      options: [
        "venueNightclub",
        "venueBar",
        "venueLounge",
        "venueRooftop",
        "venueBeachClub",
        "venueFestival",
      ],
      mandatory: true,
    },
    { key: "location", type: "select", mandatory: true },
    { key: "website", type: "text" },
    { key: "resident_djs", type: "dj-picker", mandatory: true },
    { key: "capacity", type: "number", mandatory: true },
    { key: "reservation_contact", type: "text", mandatory: true },
  ],
};

export function ProfileCompleteForm({ role, locale, userId, profile, roleData, galleryPhotos, mixes, dict }) {
  const router = useRouter();
  const t = dict.profile.complete;
  const fields = FIELD_KEYS[role];
  const allFields = [...fields, ...SOCIAL_FIELDS];
  const storageKey = `profile-draft:${userId}`;

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [values, setValues] = useState(() => {
    const initial = {};
    allFields.forEach((f) => {
      initial[f.key] = roleData?.[f.key] ?? (f.type === "dj-picker" ? [] : "");
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
    const missingCustomField = fields.find((f) => {
      if (!f.mandatory) return false;
      if (f.type === "pills") return !values[f.key];
      if (f.type === "dj-picker") return values[f.key].length === 0;
      return false;
    });
    if (missingCustomField) {
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
    allFields.forEach((f) => {
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
    <div className="relative flex-1 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-[10%] h-112 w-md rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_38%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-128 w-lg rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_32%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-[20%] h-104 w-104 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_26%,transparent),transparent_70%)] blur-3xl" />
      </div>

      <form onSubmit={handleSubmit} className="relative mx-auto flex max-w-7xl flex-col gap-6 px-6 py-16">
        <div>
          <h1 className="bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-3xl font-semibold tracking-tight text-transparent sm:text-4xl xl:text-5xl">
            {t.title}
          </h1>
          <p className="mt-6 text-sm text-foreground-muted">
            {role === "dj" ? t.subtitleDj : t.subtitleClub}
          </p>
        </div>

      <div className="mt-4 flex flex-col gap-2">
        <AvatarUpload
          userId={userId}
          initialUrl={avatarUrl}
          initialPosition={profile?.avatar_position}
          onChange={setAvatarUrl}
          t={t}
        />
        {avatarRequired && !avatarUrl && (
          <p className="text-sm text-foreground-muted">
            {t.photoLabel} <span className="text-red-500">*</span> {t.photoRequired}
          </p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
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

        {role === "dj" && (
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm text-foreground-muted" htmlFor="bio">
              {t.bioLabel} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="bio"
              rows={7}
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
            />
          </div>
        )}

        {fields
          .filter((f) => f.key !== "gender")
          .map((f) => (
          <div
            key={f.key}
            className={`flex flex-col gap-1.5 ${
              f.type === "textarea" || f.type === "pills" ? "md:col-span-2" : ""
            }`}
          >
            <label className="flex items-center gap-1.5 text-sm text-foreground-muted" htmlFor={f.key}>
              {f.icon && <f.icon className={`h-3.5 w-3.5 ${f.color || ""}`} />}
              {t.fields[f.key]} {f.mandatory && <span className="text-red-500">*</span>}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={f.key}
                rows={7}
                required={f.mandatory}
                value={values[f.key]}
                onChange={(e) => setValue(f.key, e.target.value)}
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
            ) : f.type === "dj-picker" ? (
              <ResidentDjPicker value={values[f.key]} onChange={(ids) => setValue(f.key, ids)} t={t} />
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

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background-elevated/40 p-5">
        <p className="text-sm font-medium text-foreground">{t.socialLabel}</p>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          {SOCIAL_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-sm text-foreground-muted" htmlFor={f.key}>
                <f.icon className={`h-3.5 w-3.5 ${f.color}`} />
                {t.fields[f.key]}
              </label>
              <input
                id={f.key}
                type="text"
                value={values[f.key]}
                onChange={(e) => setValue(f.key, e.target.value)}
                className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-foreground-muted">{t.socialTip}</p>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${role === "dj" ? "lg:grid-cols-2" : ""}`}>
        {role === "dj" && (
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background-elevated/40 p-5">
            <p className="text-sm font-medium text-foreground">{t.mixesLabel}</p>
            <MixEditor userId={userId} initial={mixes} t={t} />
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background-elevated/40 p-5">
          <p className="text-sm font-medium text-foreground">{t.galleryLabel}</p>
          <GalleryEditor userId={userId} initial={galleryPhotos} t={t} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <p className="text-4xl font-semibold text-foreground">
          {t.soundProfileLabel} <span className="text-red-500">*</span>{" "}
          <span className="text-sm font-normal text-foreground-muted">— {t.soundProfileHint}</span>
        </p>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {GENRE_CATEGORIES.map((category) => (
          <div key={category.label} className="flex flex-col gap-2 mt-4">
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
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-full bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] mt-10 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_color-mix(in_oklch,var(--color-accent)_35%,transparent)] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {saving ? t.saving : t.save}
      </button>
      </form>
    </div>
  );
}
