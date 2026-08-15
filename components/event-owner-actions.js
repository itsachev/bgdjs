"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { createClient } from "@/lib/supabase/client";
import { EditIcon, TrashIcon } from "@/components/icons";

// A click "arms" the delete button (red, asks to confirm) instead of firing
// straight away or blocking on a native confirm() dialog; a second click
// within the window actually deletes. Auto-disarms after a few seconds.
export function EventOwnerActions({ eventId, locale, editLabel, deleteLabel, confirmLabel, deletingLabel }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirmTimeout = useRef(null);
  const deleteBtnRef = useRef(null);

  function handleDeleteClick() {
    if (deleting) return;

    if (!confirming) {
      setConfirming(true);
      gsap.fromTo(deleteBtnRef.current, { scale: 1.08 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
      confirmTimeout.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }

    clearTimeout(confirmTimeout.current);
    handleDelete();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", eventId);
    router.push(`/${locale}/events`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/${locale}/events/${eventId}/edit`}
        className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground-muted transition-colors hover:border-accent hover:text-accent"
      >
        <EditIcon className="h-3.5 w-3.5" />
        {editLabel}
      </Link>
      <button
        ref={deleteBtnRef}
        type="button"
        onClick={handleDeleteClick}
        disabled={deleting}
        className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
          confirming
            ? "border-transparent bg-red-500 text-white"
            : "border-border text-foreground-muted hover:border-red-500 hover:text-red-500"
        }`}
      >
        <TrashIcon className="h-3.5 w-3.5" />
        {deleting ? deletingLabel : confirming ? confirmLabel : deleteLabel}
      </button>
    </div>
  );
}
