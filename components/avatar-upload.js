"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function extFromFile(file) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export function AvatarUpload({ userId, initialUrl, onChange, t }) {
  const [url, setUrl] = useState(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t.invalidImageFile);
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = extFromFile(file);
    const path = `${userId}/avatar-${Date.now()}${ext ? `.${ext}` : ""}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      contentType: file.type,
    });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq("id", userId);

    setUploading(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }

    setUrl(publicUrlData.publicUrl);
    onChange?.(publicUrlData.publicUrl);
    e.target.value = "";
  }

  async function handleRemove() {
    setRemoving(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);

    setRemoving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setUrl(null);
    onChange?.(null);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-background-elevated sm:h-32 sm:w-32 md:h-40 md:w-40">
        {url ? (
          <img src={url} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-foreground-muted">
            No photo
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-accent transition-colors hover:border-accent">
            {uploading ? t.uploadingPhoto : t.uploadPhoto}
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
          {url && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="rounded-lg bg-[linear-gradient(to_right,var(--color-red-600),var(--color-red-400))] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {removing ? t.removingPhoto : t.removePhoto}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
