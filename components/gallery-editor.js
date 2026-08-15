"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { CloseIcon, ImageIcon } from "@/components/icons";

const MAX_PHOTOS = 12;

function extFromFile(file) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

// Read intrinsic dimensions before upload so the display grid can reserve the
// right aspect ratio up front instead of shifting layout once each image loads.
function readImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  });
}

export function GalleryEditor({ userId, initial, t }) {
  const [photos, setPhotos] = useState(initial || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const remaining = MAX_PHOTOS - photos.length;

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []).slice(0, remaining);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    const supabase = createClient();
    const uploaded = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      const { width, height } = await readImageDimensions(file);

      const ext = extFromFile(file);
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext ? `.${ext}` : ""}`;

      const { error: uploadError } = await supabase.storage.from("gallery").upload(path, file, {
        contentType: file.type,
      });
      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from("gallery").getPublicUrl(path);

      const { data: row, error: dbError } = await supabase
        .from("profile_gallery")
        .insert({ profile_id: userId, url: publicUrlData.publicUrl, path, width, height })
        .select()
        .single();

      if (dbError) {
        setError(dbError.message);
        continue;
      }

      uploaded.push(row);
    }

    setPhotos((current) => [...current, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  }

  async function handleRemove(photo) {
    setPhotos((current) => current.filter((p) => p.id !== photo.id));
    const supabase = createClient();
    await supabase.storage.from("gallery").remove([photo.path]);
    await supabase.from("profile_gallery").delete().eq("id", photo.id);
  }

  return (
    <div className="flex flex-col gap-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              <Image src={photo.url} alt="" fill sizes="160px" className="object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(photo)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border bg-background-elevated px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:border-accent">
          <ImageIcon className="h-4 w-4" />
          {uploading ? t.galleryUploading : t.galleryUpload}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}

      <p className="text-xs text-foreground-muted">{t.galleryHint}</p>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
