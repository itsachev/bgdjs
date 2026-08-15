"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function extFromFile(file) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export function SiteAudioEditor({ initial }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [authorInfo, setAuthorInfo] = useState(initial?.author_info ?? "");
  const [mediaUrl, setMediaUrl] = useState(initial?.media_url ?? null);
  const [mediaPath, setMediaPath] = useState(initial?.media_path ?? null);

  const [savingTitle, setSavingTitle] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function saveTitle() {
    setSavingTitle(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("site_audio")
      .update({ title: title || null, author_info: authorInfo || null })
      .eq("id", 1);

    setSavingTitle(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Title saved.");
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setError("Please choose an audio file.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mediaPath) {
      await supabase.storage.from("audio").remove([mediaPath]);
    }

    const ext = extFromFile(file);
    const path = `track-${Date.now()}${ext ? `.${ext}` : ""}`;

    const { error: uploadError } = await supabase.storage.from("audio").upload(path, file, {
      contentType: file.type,
    });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("audio").getPublicUrl(path);

    const { error: dbError } = await supabase
      .from("site_audio")
      .update({ media_url: publicUrlData.publicUrl, media_path: path })
      .eq("id", 1);

    setUploading(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }

    setMediaUrl(publicUrlData.publicUrl);
    setMediaPath(path);
    setMessage("Track updated.");
    e.target.value = "";
  }

  async function handleRemove() {
    setRemoving(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mediaPath) {
      await supabase.storage.from("audio").remove([mediaPath]);
    }

    const { error } = await supabase
      .from("site_audio")
      .update({ media_url: null, media_path: null })
      .eq("id", 1);

    setRemoving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setMediaUrl(null);
    setMediaPath(null);
    setMessage("Track removed.");
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground-muted" htmlFor="audioTitle">
            Song title
          </label>
          <input
            id="audioTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Track name shown next to the player"
            className="rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground-muted" htmlFor="audioAuthorInfo">
            Song author info
          </label>
          <textarea
            id="audioAuthorInfo"
            value={authorInfo}
            onChange={(e) => setAuthorInfo(e.target.value)}
            placeholder="A line or two about the author, shown after the title when a visitor hovers the player"
            rows={3}
            className="resize-none rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>

        <button
          type="button"
          onClick={saveTitle}
          disabled={savingTitle}
          className="self-start rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {savingTitle ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">Track file</p>
        {mediaUrl ? (
          <div className="flex flex-col gap-3">
            <audio src={mediaUrl} controls className="w-full" />
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="self-start rounded-lg bg-[linear-gradient(to_right,var(--color-red-600),var(--color-red-400))] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {removing ? "Removing..." : "Remove"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">No track set — the player is hidden site-wide until one is uploaded.</p>
        )}

        <label className="flex h-16 w-fit cursor-pointer items-center gap-2 rounded-lg border border-border bg-background-elevated px-4 text-sm font-medium text-accent transition-colors hover:border-accent">
          {uploading ? "Uploading..." : mediaUrl ? "Replace track" : "Upload track"}
          <input type="file" accept="audio/*" onChange={handleUpload} disabled={uploading} className="hidden" />
        </label>
      </div>

      {message && <p className="text-sm text-accent-2">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
