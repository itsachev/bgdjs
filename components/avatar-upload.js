"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

function extFromFile(file) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function parsePosition(value) {
  const match = /^([\d.]+)%\s+([\d.]+)%$/.exec(value || "");
  if (!match) return { x: 50, y: 50 };
  return { x: Number(match[1]), y: Number(match[2]) };
}

const clamp = (n) => Math.min(100, Math.max(0, n));

export function AvatarUpload({ userId, initialUrl, initialPosition, onChange, t }) {
  const [url, setUrl] = useState(initialUrl ?? null);
  const [position, setPosition] = useState(() => parsePosition(initialPosition));
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const frameRef = useRef(null);
  const dragStateRef = useRef(null);

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
    const resetPosition = { x: 50, y: 50 };

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrlData.publicUrl, avatar_position: "50% 50%" })
      .eq("id", userId);

    setUploading(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }

    setUrl(publicUrlData.publicUrl);
    setPosition(resetPosition);
    onChange?.(publicUrlData.publicUrl);
    e.target.value = "";
  }

  async function handleRemove() {
    setRemoving(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null, avatar_position: null })
      .eq("id", userId);

    setRemoving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setUrl(null);
    setPosition({ x: 50, y: 50 });
    onChange?.(null);
  }

  const savePosition = useCallback(
    async (next) => {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ avatar_position: `${next.x}% ${next.y}%` })
        .eq("id", userId);
    },
    [userId]
  );

  function handlePointerDown(e) {
    if (!url || !frameRef.current) return;
    e.preventDefault();
    frameRef.current.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosition: position,
      size: frameRef.current.getBoundingClientRect(),
    };
    setDragging(true);
  }

  function handlePointerMove(e) {
    const drag = dragStateRef.current;
    if (!drag) return;

    const deltaXPercent = ((e.clientX - drag.startX) / drag.size.width) * 100;
    const deltaYPercent = ((e.clientY - drag.startY) / drag.size.height) * 100;

    setPosition({
      x: clamp(drag.startPosition.x - deltaXPercent),
      y: clamp(drag.startPosition.y - deltaYPercent),
    });
  }

  function handlePointerUp(e) {
    if (!dragStateRef.current) return;
    frameRef.current?.releasePointerCapture(e.pointerId);
    dragStateRef.current = null;
    setDragging(false);
    setPosition((current) => {
      savePosition(current);
      return current;
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1.5">
        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`relative h-24 w-24 shrink-0 touch-none overflow-hidden rounded-full border border-border bg-background-elevated select-none sm:h-32 sm:w-32 md:h-40 md:w-40 ${
            url ? "cursor-grab active:cursor-grabbing" : ""
          }`}
        >
          {url ? (
            <Image
              src={url}
              alt="Avatar"
              fill
              draggable={false}
              sizes="160px"
              className="object-cover"
              style={{ objectPosition: `${position.x}% ${position.y}%` }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-foreground-muted">
              No photo
            </span>
          )}
        </div>
        {url && (
          <p className={`text-xs text-foreground-muted transition-opacity ${dragging ? "opacity-100" : "opacity-60"}`}>
            {t.dragToReposition}
          </p>
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
