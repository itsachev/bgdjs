"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function extFromFile(file) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export function LoginBackgroundEditor({ initial }) {
  const [mediaUrl, setMediaUrl] = useState(initial?.media_url ?? null);
  const [mediaPath, setMediaPath] = useState(initial?.media_path ?? null);
  const [mediaType, setMediaType] = useState(initial?.media_type ?? null);

  const [uploading, setUploading] = useState(false);
  const [removingMedia, setRemovingMedia] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

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
      await supabase.storage.from("login").remove([mediaPath]);
    }

    const ext = extFromFile(file);
    const path = `background-${Date.now()}${ext ? `.${ext}` : ""}`;

    const { error: uploadError } = await supabase.storage.from("login").upload(path, file, {
      contentType: file.type,
    });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("login").getPublicUrl(path);
    const newMediaType = isVideo ? "video" : "image";

    const { error: dbError } = await supabase
      .from("login_content")
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
      await supabase.storage.from("login").remove([mediaPath]);
    }

    const { error } = await supabase
      .from("login_content")
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
    <div className="mt-6 flex flex-col gap-3">
      <p className="text-sm font-medium uppercase tracking-wide text-accent">Live now</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background-elevated">
          {mediaUrl ? (
            <>
              {mediaType === "video" ? (
                <video src={mediaUrl} className="h-full w-full object-cover" muted autoPlay loop playsInline />
              ) : (
                <img src={mediaUrl} alt="Current login background" className="h-full w-full object-cover" />
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

      {message && <p className="text-sm text-accent-2">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
