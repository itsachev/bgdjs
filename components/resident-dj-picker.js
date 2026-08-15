"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { SearchIcon, CloseIcon, CheckIcon, UserIcon, PlusIcon } from "@/components/icons";

// value is a list of entries: { id } for a registered DJ, or { name } for a
// resident who isn't on the platform yet — typed in manually.
export function ResidentDjPicker({ value, onChange, t }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [djs, setDjs] = useState([]);
  const [loading, setLoading] = useState(true);

  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  const entries = value || [];
  const selectedIds = entries.filter((e) => e.id).map((e) => e.id);
  const customNames = entries.filter((e) => e.name).map((e) => e.name);
  const djById = useRef(new Map());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: profiles }, { data: djProfiles }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, avatar_url").eq("role", "dj").order("display_name"),
        supabase.from("dj_profiles").select("id, stage_name, location"),
      ]);
      const lookup = new Map((djProfiles || []).map((d) => [d.id, d]));
      const merged = (profiles || []).map((p) => ({ ...p, dj: lookup.get(p.id) }));
      djById.current = new Map(merged.map((d) => [d.id, d]));
      setDjs(merged);
      setLoading(false);
    }
    load();
  }, []);

  // Establish the closed baseline once the portal exists, then animate purely off `open`.
  useEffect(() => {
    if (!mounted || !panelRef.current || !backdropRef.current) return;
    gsap.set(panelRef.current, { xPercent: 100 });
    gsap.set(backdropRef.current, { autoAlpha: 0 });
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !panelRef.current || !backdropRef.current) return;

    if (open) {
      gsap.to(panelRef.current, { xPercent: 0, duration: 0.5, ease: "power4.out" });
      gsap.to(backdropRef.current, { autoAlpha: 1, duration: 0.3 });
      document.body.style.overflow = "hidden";
      searchRef.current?.focus();
    } else {
      gsap.to(panelRef.current, { xPercent: 100, duration: 0.4, ease: "power3.in" });
      gsap.to(backdropRef.current, { autoAlpha: 0, duration: 0.3 });
      document.body.style.overflow = "";
      setQuery("");
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggleDj(id) {
    onChange(selectedIds.includes(id) ? entries.filter((e) => e.id !== id) : [...entries, { id }]);
  }

  function addCustomName(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists =
      customNames.some((n) => n.toLowerCase() === trimmed.toLowerCase()) ||
      djs.some(
        (d) =>
          selectedIds.includes(d.id) &&
          (d.dj?.stage_name?.toLowerCase() === trimmed.toLowerCase() || d.display_name.toLowerCase() === trimmed.toLowerCase())
      );
    if (exists) return;
    onChange([...entries, { name: trimmed }]);
    setQuery("");
  }

  function removeCustomName(name) {
    onChange(entries.filter((e) => e.name !== name));
  }

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? djs.filter(
        ({ display_name, dj }) =>
          display_name.toLowerCase().includes(needle) ||
          dj?.stage_name?.toLowerCase().includes(needle) ||
          dj?.location?.toLowerCase().includes(needle)
      )
    : djs;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(true)}
        className="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background-elevated px-3 py-2 outline-none focus:border-accent"
      >
        {entries.length === 0 ? (
          <span className="px-1 text-foreground-muted">{t.residentDjPlaceholder}</span>
        ) : (
          entries.map((entry) => {
            const d = entry.id ? djById.current.get(entry.id) : null;
            const label = entry.id ? d?.dj?.stage_name || d?.display_name || "…" : entry.name;
            return (
              <span
                key={entry.id || `name:${entry.name}`}
                className="flex items-center gap-1.5 rounded-full bg-accent/15 py-1 pl-1 pr-2 text-sm font-medium text-accent"
              >
                {entry.id && d?.avatar_url ? (
                  <Image src={d.avatar_url} alt="" width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
                    <UserIcon className="h-3 w-3" />
                  </span>
                )}
                {label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    entry.id ? toggleDj(entry.id) : removeCustomName(entry.name);
                  }}
                  aria-label={`Remove ${label}`}
                  className="text-accent/70 hover:text-accent"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </span>
            );
          })
        )}
      </div>

      {mounted &&
        createPortal(
          <>
            <div
              ref={backdropRef}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm"
            />
            <div
              ref={panelRef}
              className="fixed inset-y-0 right-0 z-101 flex w-full max-w-md flex-col bg-background-elevated shadow-2xl"
            >
              <div className="flex flex-col gap-2 border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomName(query))}
                      placeholder={t.residentDjSearchPlaceholder}
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 outline-none focus:border-accent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-background hover:text-foreground"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>

                {query.trim() ? (
                  <button
                    type="button"
                    onClick={() => addCustomName(query)}
                    className="flex items-center gap-2 self-start rounded-full border border-dashed border-accent/50 py-1.5 pl-2 pr-3 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    {t.residentDjAddPrefix} "{query.trim()}"
                  </button>
                ) : (
                  <p className="px-1 text-xs text-foreground-muted">{t.residentDjAddHint}</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {customNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2.5">
                    {customNames.map((name) => (
                      <span
                        key={name}
                        className="flex items-center gap-1.5 rounded-full bg-accent/10 py-1 pl-3 pr-1.5 text-sm font-medium text-accent"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeCustomName(name)}
                          aria-label={`Remove ${name}`}
                          className="flex h-5 w-5 items-center justify-center rounded-full text-accent/70 hover:text-accent"
                        >
                          <CloseIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {loading ? null : filtered.length === 0 ? (
                  <p className="p-4 text-sm text-foreground-muted">{t.residentDjNoResults}</p>
                ) : (
                  filtered.map((d) => {
                    const selected = selectedIds.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        role="checkbox"
                        aria-checked={selected}
                        tabIndex={0}
                        onClick={() => toggleDj(d.id)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleDj(d.id)}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-colors ${
                          selected ? "bg-accent/10" : "hover:bg-background"
                        }`}
                      >
                        {d.avatar_url ? (
                          <Image
                            src={d.avatar_url}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground-muted">
                            <UserIcon className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{d.dj?.stage_name || d.display_name}</p>
                          {d.dj?.location && <p className="truncate text-xs text-foreground-muted">{d.dj.location}</p>}
                        </div>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            selected ? "border-accent bg-accent text-white" : "border-border text-transparent"
                          }`}
                        >
                          <CheckIcon className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border p-4">
                <p className="text-sm text-foreground-muted">
                  {entries.length} {t.residentDjSelected}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {t.residentDjDone}
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
