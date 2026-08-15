"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MailIcon, CopyIcon, CheckIcon, ArrowUpRightIcon } from "@/components/icons";

gsap.registerPlugin(ScrollTrigger);

export function ContactSection({ email, title, subtitle, eyebrow, copyLabel, copiedLabel }) {
  const rootRef = useRef(null);
  const fieldRef = useRef(null);
  const magnetRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // scrub ties progress directly to scroll position instead of a one-shot
      // play, so the reveal always tracks the section in and out of view
      // instead of only firing once on first entry.
      gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 65%",
          end: "top 20%",
          scrub: true,
        },
        defaults: { ease: "power3.out" },
      })
        .from("[data-contact-eyebrow]", { opacity: 0, y: 16, duration: 0.5 })
        .from("[data-contact-title]", { opacity: 0, y: 28, duration: 0.7 }, "-=0.3")
        .from("[data-contact-subtitle]", { opacity: 0, y: 16, duration: 0.6 }, "-=0.45")
        .from("[data-contact-email]", { opacity: 0, y: 16, duration: 0.6 }, "-=0.4")
        .from("[data-contact-button]", { opacity: 0, scale: 0.8, duration: 0.5 }, "-=0.45");
    }, rootRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    // The pull is tracked over a padded "field" well beyond the button's own
    // edges (see the wrapper below) so the magnet visibly engages before the
    // cursor ever touches it, then drags the button hard toward the pointer.
    const field = fieldRef.current;
    const button = magnetRef.current;
    if (!field || !button) return;

    const xTo = gsap.quickTo(button, "x", { duration: 0.45, ease: "power3" });
    const yTo = gsap.quickTo(button, "y", { duration: 0.45, ease: "power3" });
    const clamp = gsap.utils.clamp(-38, 38);

    function handleMove(e) {
      const rect = field.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      xTo(clamp(relX * 0.7));
      yTo(clamp(relY * 0.7));
    }

    function handleLeave() {
      xTo(0);
      yTo(0);
    }

    field.addEventListener("mousemove", handleMove);
    field.addEventListener("mouseleave", handleLeave);
    return () => {
      field.removeEventListener("mousemove", handleMove);
      field.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(email).catch(() => {});
    gsap
      .timeline()
      .to(magnetRef.current, { scale: 1.15, duration: 0.15, ease: "power2.out" })
      .to(magnetRef.current, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" });
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden rounded-3xl border border-border bg-background-elevated/40 px-6 py-16 sm:px-12 sm:py-20"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[5%] h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_32%,transparent),transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-24 left-[8%] h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent-2)_28%,transparent),transparent_70%)] blur-3xl" />
      </div>

      <p
        data-contact-eyebrow
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-accent"
      >
        <MailIcon className="h-3.5 w-3.5" /> {eyebrow}
      </p>

      <h2
        data-contact-title
        className="mt-4 text-balance bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-3xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl"
      >
        {title}
      </h2>
      <p data-contact-subtitle className="mt-4 max-w-md text-foreground-muted">
        {subtitle}
      </p>

      <div className="mt-12 flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <a
          data-contact-email
          href={`mailto:${email}`}
          className="group inline-flex max-w-full items-center gap-3 font-display text-3xl font-semibold tracking-tight break-all text-foreground transition-colors hover:text-accent sm:text-6xl lg:text-7xl"
        >
          {email}
          <ArrowUpRightIcon className="h-7 w-7 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
        </a>

        <div ref={fieldRef} className="p-8" data-contact-button>
          <button
            ref={magnetRef}
            type="button"
            onClick={handleCopy}
            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-full bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] text-white shadow-[0_0_40px_color-mix(in_oklch,var(--color-accent)_35%,transparent)] transition-transform hover:scale-105"
          >
            {copied ? <CheckIcon className="h-5 w-5" /> : <CopyIcon className="h-5 w-5" />}
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              {copied ? copiedLabel : copyLabel}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
