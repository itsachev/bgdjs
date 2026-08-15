"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CloseIcon, PlusIcon, MixcloudIcon, SoundcloudIcon, YoutubeIcon, LinkIcon } from "@/components/icons";
import { detectMixPlatform } from "@/lib/mix-embed";

const MAX_MIXES = 12;

const PLATFORM_ICONS = {
  mixcloud: MixcloudIcon,
  soundcloud: SoundcloudIcon,
  youtube: YoutubeIcon,
};

export function MixEditor({ userId, initial, t }) {
  const [mixes, setMixes] = useState(initial || []);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const remaining = MAX_MIXES - mixes.length;

  async function handleAdd() {
    if (!url.trim()) return;
    setError(null);

    const platform = detectMixPlatform(url.trim());
    if (!platform) {
      setError(t.mixesInvalidUrl);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: row, error: dbError } = await supabase
      .from("dj_mixes")
      .insert({ profile_id: userId, title: title.trim() || url.trim(), url: url.trim(), platform })
      .select()
      .single();
    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setMixes((current) => [...current, row]);
    setTitle("");
    setUrl("");
  }

  function handleEnter(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleAdd();
  }

  async function handleRemove(mix) {
    setMixes((current) => current.filter((m) => m.id !== mix.id));
    const supabase = createClient();
    await supabase.from("dj_mixes").delete().eq("id", mix.id);
  }

  return (
    <div className="flex flex-col gap-3">
      {mixes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {mixes.map((mix) => {
            const PlatformIcon = PLATFORM_ICONS[mix.platform] || LinkIcon;
            return (
              <li
                key={mix.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background-elevated px-4 py-2.5"
              >
                <PlatformIcon className="h-4 w-4 shrink-0 text-accent" />
                <span className="flex-1 truncate text-sm">{mix.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(mix)}
                  aria-label="Remove mix"
                  className="shrink-0 text-foreground-muted transition-colors hover:text-red-500"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {remaining > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleEnter}
            placeholder={t.mixesTitlePlaceholder}
            className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 text-sm outline-none focus:border-accent sm:w-48"
          />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleEnter}
            placeholder={t.mixesUrlPlaceholder}
            className="flex-1 rounded-lg border border-border bg-background-elevated px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !url.trim()}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:border-accent disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            {t.mixesAdd}
          </button>
        </div>
      )}

      <p className="text-xs text-foreground-muted">{t.mixesHint}</p>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
