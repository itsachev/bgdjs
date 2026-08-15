"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { BULGARIAN_CITIES } from "@/lib/bulgarian-cities";
import { CalendarIcon, MapPinIcon, TicketIcon, ImageIcon, CloseIcon } from "@/components/icons";

function extFromFile(file) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

// `datetime-local` inputs want a timezone-naive local string, not the UTC
// ISO string Postgres returns, so this reads back the browser's local
// year/month/day/hour/minute instead of doing a straight substring slice.
function toDatetimeLocalValue(isoString) {
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EventCreateForm({ locale, userId, t, event }) {
  const router = useRouter();
  const isEditing = Boolean(event);

  const [coverUrl, setCoverUrl] = useState(event?.cover_url ?? null);
  const [coverPath, setCoverPath] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startsAt, setStartsAt] = useState(event ? toDatetimeLocalValue(event.starts_at) : "");
  const [city, setCity] = useState(event?.city ?? "");
  const [venueName, setVenueName] = useState(event?.venue_name ?? "");
  const [ticketUrl, setTicketUrl] = useState(event?.ticket_url ?? "");
  const [priceInfo, setPriceInfo] = useState(event?.price_info ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t.invalidImageFile);
      return;
    }

    setUploadingCover(true);
    setError(null);
    const supabase = createClient();
    const ext = extFromFile(file);
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext ? `.${ext}` : ""}`;

    const { error: uploadError } = await supabase.storage.from("events").upload(path, file, {
      contentType: file.type,
    });

    setUploadingCover(false);
    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("events").getPublicUrl(path);
    setCoverUrl(publicUrlData.publicUrl);
    setCoverPath(path);
    e.target.value = "";
  }

  async function handleRemoveCover() {
    if (coverPath) {
      const supabase = createClient();
      await supabase.storage.from("events").remove([coverPath]);
    }
    setCoverUrl(null);
    setCoverPath(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !startsAt || !city) {
      setError(t.errorRequired);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      cover_url: coverUrl,
      starts_at: new Date(startsAt).toISOString(),
      city,
      venue_name: venueName.trim() || null,
      ticket_url: ticketUrl.trim() || null,
      price_info: priceInfo.trim() || null,
    };

    const { data: row, error: dbError } = isEditing
      ? await supabase.from("events").update(payload).eq("id", event.id).select().single()
      : await supabase.from("events").insert({ ...payload, organizer_id: userId }).select().single();

    setSaving(false);
    if (dbError || !row) {
      setError(dbError?.message || t.errorGeneric);
      return;
    }

    router.push(isEditing ? `/${locale}/events/${event.id}` : `/${locale}/events`);
    router.refresh();
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-[10%] h-112 w-md rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_38%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-128 w-lg rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_32%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-[20%] h-104 w-104 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_26%,transparent),transparent_70%)] blur-3xl" />
      </div>

      <form onSubmit={handleSubmit} className="relative mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <div>
          <h1 className="bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-3xl font-semibold tracking-tight text-transparent sm:text-4xl xl:text-5xl">
            {isEditing ? t.editTitle : t.title}
          </h1>
          <p className="mt-6 text-sm text-foreground-muted">{isEditing ? t.editSubtitle : t.subtitle}</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-foreground-muted">{t.coverLabel}</p>
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-background-elevated">
            {coverUrl ? (
              <>
                <Image src={coverUrl} alt="" fill sizes="768px" className="object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  aria-label={t.removeCover}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </>
            ) : (
              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-foreground-muted transition-colors hover:text-accent">
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm font-medium">{uploadingCover ? t.uploadingCover : t.uploadCover}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground-muted" htmlFor="event-title">
            {t.titleLabel} <span className="text-red-500">*</span>
          </label>
          <input
            id="event-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground-muted" htmlFor="event-description">
            {t.descriptionLabel}
          </label>
          <textarea
            id="event-description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-sm text-foreground-muted" htmlFor="event-starts-at">
              <CalendarIcon className="h-3.5 w-3.5" />
              {t.startsAtLabel} <span className="text-red-500">*</span>
            </label>
            <input
              id="event-starts-at"
              type="datetime-local"
              lang="bg-BG"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-sm text-foreground-muted" htmlFor="event-city">
              <MapPinIcon className="h-3.5 w-3.5" />
              {t.cityLabel} <span className="text-red-500">*</span>
            </label>
            <select
              id="event-city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
            >
              <option value="">{t.selectCity}</option>
              {BULGARIAN_CITIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c[locale] ?? c.en}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground-muted" htmlFor="event-venue">
              {t.venueNameLabel}
            </label>
            <input
              id="event-venue"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground-muted" htmlFor="event-price">
              {t.priceInfoLabel}
            </label>
            <input
              id="event-price"
              value={priceInfo}
              onChange={(e) => setPriceInfo(e.target.value)}
              placeholder={t.priceInfoPlaceholder}
              className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="flex items-center gap-1.5 text-sm text-foreground-muted" htmlFor="event-ticket-url">
              <TicketIcon className="h-3.5 w-3.5" />
              {t.ticketUrlLabel}
            </label>
            <input
              id="event-ticket-url"
              type="text"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-full bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] mt-4 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_color-mix(in_oklch,var(--color-accent)_35%,transparent)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isEditing ? (saving ? t.savingChanges : t.saveChanges) : saving ? t.saving : t.save}
        </button>
      </form>
    </div>
  );
}
