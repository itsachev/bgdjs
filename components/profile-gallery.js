"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import Image from "next/image";
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const PREVIEW_COUNT = 5;

// Reserves the tile's box (via the parent's aspect-ratio/aspect-square) before the
// image arrives — no layout shift — and fades each thumbnail in on its own load
// event rather than popping in abruptly.
function GalleryThumb({ photo, sizes }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      src={photo.url}
      alt=""
      fill
      sizes={sizes}
      onLoad={() => setLoaded(true)}
      className={`object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-105 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

export function ProfileGallery({ photos, title, seeAllLabel, seeLessLabel }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  const backdropRef = useRef(null);
  const open = activeIndex !== null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Deliberately excludes activeIndex — this should only fade the backdrop in once on
  // open, not replay (and briefly reveal the page behind it) on every prev/next click.
  useEffect(() => {
    if (!open || !mounted || !backdropRef.current) return;
    gsap.fromTo(backdropRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") setActiveIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i - 1 + photos.length) % photos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  if (!photos || photos.length === 0) return null;

  const hasMore = !expanded && photos.length > PREVIEW_COUNT;
  const visiblePhotos = hasMore ? photos.slice(0, PREVIEW_COUNT) : photos;
  const activePhoto = open ? photos[activeIndex] : null;

  return (
    <div>
      {title && <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{title}</p>}

      {expanded ? (
        <>
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                style={{ aspectRatio: photo.width && photo.height ? `${photo.width} / ${photo.height}` : "4 / 5" }}
                className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl border border-border bg-background-elevated"
              >
                <GalleryThumb photo={photo} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-4 text-sm font-semibold text-accent hover:text-accent-2"
          >
            ← {seeLessLabel}
          </button>
        </>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {visiblePhotos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-background-elevated"
            >
              <GalleryThumb photo={photo} sizes="(min-width: 768px) 16vw, (min-width: 640px) 25vw, 33vw" />
            </button>
          ))}
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="group flex aspect-square flex-col items-center justify-center gap-1 rounded-xl bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] text-white transition-transform duration-300 hover:scale-[1.03]"
            >
              <span className="font-display text-2xl font-bold">+{photos.length - PREVIEW_COUNT}</span>
              <span className="text-xs font-semibold uppercase tracking-wide opacity-90 transition-transform group-hover:translate-x-0.5">
                {seeAllLabel} →
              </span>
            </button>
          )}
        </div>
      )}

      {mounted &&
        open &&
        createPortal(
          <div
            ref={backdropRef}
            onClick={() => setActiveIndex(null)}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((i) => (i - 1 + photos.length) % photos.length);
                  }}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:left-4"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((i) => (i + 1) % photos.length);
                  }}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:right-4"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element -- full-res on-demand view; native max-h/max-w + object-contain sizing */}
            <img
              key={activeIndex}
              src={activePhoto.url}
              alt=""
              decoding="async"
              onClick={(e) => e.stopPropagation()}
              onLoad={(e) =>
                gsap.fromTo(
                  e.currentTarget,
                  { autoAlpha: 0, scale: 0.96 },
                  { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" }
                )
              }
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain opacity-0 shadow-2xl"
            />

            {photos.length > 1 && (
              <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/70">
                {activeIndex + 1} / {photos.length}
              </p>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
