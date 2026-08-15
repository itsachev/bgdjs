"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const DEBOUNCE_MS = 500;

export function EntitySearch({ basePath, initialQuery, initialGenre, placeholder, searchLabel }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const skipNextDebounce = useRef(true);

  function go(q) {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (initialGenre) params.set("genre", initialGenre);
    const qs = params.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ""}`, { scroll: false });
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
      className="mt-8 flex flex-col gap-3 sm:flex-row"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-border bg-background-elevated px-4 py-2.5 outline-none focus:border-accent"
      />
      <button
        type="submit"
        className="rounded-lg bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {searchLabel}
      </button>
    </form>
  );
}
