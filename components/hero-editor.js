"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function extFromFile(file) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export function HeroEditor({ initial }) {
  const [titleBg, setTitleBg] = useState(initial?.title_bg ?? "");
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? "");
  const [mediaUrl, setMediaUrl] = useState(initial?.media_url ?? null);
  const [mediaPath, setMediaPath] = useState(initial?.media_path ?? null);
  const [mediaType, setMediaType] = useState(initial?.media_type ?? null);

  const [savingTitle, setSavingTitle] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingMedia, setRemovingMedia] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function saveTitles() {
    setSavingTitle(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("hero_content")
      .update({ title_bg: titleBg || null, title_en: titleEn || null })
      .eq("id", 1);

    setSavingTitle(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Title saved.");
  }

  async function clearTitle(lang) {
    setError(null);
    setMessage(null);
    if (lang === "bg") setTitleBg("");
    else setTitleEn("");

    const supabase = createClient();
    const { error } = await supabase
      .from("hero_content")
      .update({ [lang === "bg" ? "title_bg" : "title_en"]: null })
      .eq("id", 1);

    if (error) setError(error.message);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Please choose an image or video file.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mediaPath) {
      await supabase.storage.from("hero").remove([mediaPath]);
    }

    const ext = extFromFile(file);
    const path = `background-${Date.now()}${ext ? `.${ext}` : ""}`;

    const { error: uploadError } = await supabase.storage.from("hero").upload(path, file, {
      contentType: file.type,
    });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("hero").getPublicUrl(path);
    const newMediaType = isVideo ? "video" : "image";

    const { error: dbError } = await supabase
      .from("hero_content")
      .update({ media_url: publicUrlData.publicUrl, media_path: path, media_type: newMediaType })
      .eq("id", 1);

    setUploading(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }

    setMediaUrl(publicUrlData.publicUrl);
    setMediaPath(path);
    setMediaType(newMediaType);
    setMessage("Background updated.");
    e.target.value = "";
  }

  async function handleRemoveMedia() {
    setRemovingMedia(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mediaPath) {
      await supabase.storage.from("hero").remove([mediaPath]);
    }

    const { error } = await supabase
      .from("hero_content")
      .update({ media_url: null, media_path: null, media_type: null })
      .eq("id", 1);

    setRemovingMedia(false);
    if (error) {
      setError(error.message);
      return;
    }

    setMediaUrl(null);
    setMediaPath(null);
    setMediaType(null);
    setMessage("Background removed.");
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground-muted" htmlFor="titleBg">
            Title (BG)
          </label>
          <div className="flex gap-2">
            <input
              id="titleBg"
              value={titleBg}
              onChange={(e) => setTitleBg(e.target.value)}
              placeholder="Тук живее сцената"
              className="flex-1 rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => clearTitle("bg")}
              className="rounded-lg border border-border px-3 text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              Remove
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground-muted" htmlFor="titleEn">
            Title (EN)
          </label>
          <div className="flex gap-2">
            <input
              id="titleEn"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Where the scene lives"
              className="flex-1 rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => clearTitle("en")}
              className="rounded-lg border border-border px-3 text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              Remove
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={saveTitles}
          disabled={savingTitle}
          className="self-start rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {savingTitle ? "Saving..." : "Save title"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">Live now</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background-elevated">
            {mediaUrl ? (
              <>
                {mediaType === "video" ? (
                  <video src={mediaUrl} className="h-full w-full object-cover" muted autoPlay loop playsInline />
                ) : (
                  <img src={mediaUrl} alt="Current hero background" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  disabled={removingMedia}
                  aria-label="Remove background"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                >
                  {removingMedia ? "…" : "×"}
                </button>
              </>
            ) : (
              <span className="px-4 text-center text-sm text-foreground-muted">No background set</span>
            )}
          </div>

          <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-background-elevated text-sm font-medium text-accent transition-colors hover:border-accent">
            {uploading ? "Uploading..." : "Upload"}
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {message && <p className="text-sm text-accent-2">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
