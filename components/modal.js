"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Modal({ children, widthClassName = "max-w-md" }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));

    function onKeyDown(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [close]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4 py-8" role="dialog" aria-modal="true">
      <div
        aria-hidden="true"
        onClick={close}
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        data-lenis-prevent
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl transition-all duration-200 sm:p-8 ${widthClassName} ${
          visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-1 opacity-0 scale-95"
        }`}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
