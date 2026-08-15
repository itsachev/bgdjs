"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLenis } from "./smooth-scroll-provider";

const DEBOUNCE_MS = 500;
const SUGGEST_DEBOUNCE_MS = 250;

export function EntitySearch({
  basePath,
  searchApi,
  initialQuery,
  initialGenre,
  placeholder,
  searchLabel,
  className = "",
}) {
  const router = useRouter();
  const lenisRef = useLenis();
  const [value, setValue] = useState(initialQuery);
  const skipNextDebounce = useRef(true);
  const [isPending, startTransition] = useTransition();
  const wasPending = useRef(false);
  const savedScrollY = useRef(0);

  const containerRef = useRef(null);
  const [results, setResults] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function go(q) {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (initialGenre) params.set("genre", initialGenre);
    const qs = params.toString();
    savedScrollY.current = window.scrollY;
    startTransition(() => {
      router.push(`${basePath}${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  }

  useEffect(() => {
    if (skipNextDebounce.current) {
      skipNextDebounce.current = false;
      return;
    }
    const timeout = setTimeout(() => go(value), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // A faster, separate debounce feeds the results dropdown so suggestions
  // feel live without waiting on the slower full-page navigation above.
  useEffect(() => {
    if (!searchApi) return;
    const q = value.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`${searchApi}?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => setResults(data.results || []))
        .catch(() => {});
    }, SUGGEST_DEBOUNCE_MS);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [value, searchApi]);

  // Close the dropdown on outside click / Escape, not on every render.
  useEffect(() => {
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Fewer/shorter results can shrink the page mid-transition; Lenis (and the
  // browser) then clamp scroll against that transient height instead of the
  // final one, landing well short of where the settled page would actually
  // allow. Once the transition settles, only step in when that under-clamp
  // actually happened — re-applying scroll unconditionally (even when the
  // list grew back and the position was already correct) fights Lenis's own
  // settling and is what caused the visible flicker.
  useEffect(() => {
    if (wasPending.current && !isPending) {
      const lenis = lenisRef?.current;
      if (lenis) lenis.resize();
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const target = Math.min(savedScrollY.current, Math.max(maxScroll, 0));
      if (target - window.scrollY > 4) {
        if (lenis) {
          lenis.scrollTo(target, { immediate: true });
        } else {
          window.scrollTo(0, target);
        }
      }
    }
    wasPending.current = isPending;
  }, [isPending, lenisRef]);

  const showDropdown = dropdownOpen && results.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setDropdownOpen(false);
          go(value);
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
        />
        {/* Kept in the DOM (not removed) so pressing Enter still submits — just not shown, since the debounce already searches as you type. */}
        <button type="submit" className="sr-only">
          {searchLabel}
        </button>
      </form>

      {showDropdown && (
        <div
          data-lenis-prevent
          className="absolute inset-x-0 top-full z-20 mt-2 max-h-66.25 divide-y divide-border overflow-y-auto rounded-lg border border-border bg-background-elevated shadow-xl"
        >
          {results.map((result) => (
            <Link
              key={result.id}
              href={`${basePath}/${encodeURIComponent(result.slug)}`}
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-background"
            >
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-background font-display text-xs font-semibold text-accent">
                {result.avatar_url ? (
                  <Image
                    src={result.avatar_url}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                    style={{ objectPosition: result.avatar_position || "50% 50%" }}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    {result.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="truncate text-sm font-medium">{result.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
