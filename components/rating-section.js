"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { StarIcon, CloseIcon, ChevronRightIcon } from "@/components/icons";

gsap.registerPlugin(ScrollTrigger);

const CRITERIA_BY_ROLE = {
  dj: ["mixing", "trackSelection", "crowdReading", "stagePresence"],
  club: ["sound", "atmosphere", "crowd", "service"],
};

// Same preview-then-expand convention as ProfileGallery: show a fixed count
// and fold the rest behind a single tile rather than growing the page
// unbounded once a profile racks up a lot of reviews.
const PREVIEW_COUNT = 2;

// Fixed 4-axis layout (both roles always have exactly 4 criteria) — top,
// right, bottom, left — so the per-index anchor/offset math below can stay
// hardcoded instead of generalizing for an arbitrary N that never occurs.
const RADAR_SIZE = 220;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = 76;
const AXIS_ANGLES = [-90, 0, 90, 180];
const LABEL_ANCHORS = ["middle", "start", "middle", "end"];

function axisPoint(index, fraction) {
  const angle = (AXIS_ANGLES[index] * Math.PI) / 180;
  const r = RADAR_RADIUS * fraction;
  return [RADAR_CENTER + r * Math.cos(angle), RADAR_CENTER + r * Math.sin(angle)];
}

function pointsAttr(fractions) {
  return fractions.map((f, i) => axisPoint(i, f).join(",")).join(" ");
}

function formatDate(iso, locale) {
  return new Intl.DateTimeFormat(locale === "bg" ? "bg-BG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function StarPicker({ value, onChange, readOnly, size = "md" }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const starClass = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (readOnly) {
    return (
      <div className="flex gap-0.5 text-accent">
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} filled={n <= Math.round(value)} className={starClass} />
        ))}
      </div>
    );
  }

  function handleClick(n, e) {
    gsap
      .timeline()
      .to(e.currentTarget, { scale: 1.35, duration: 0.15, ease: "power2.out" })
      .to(e.currentTarget, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" });
    onChange(n);
  }

  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onClick={(e) => handleClick(n, e)}
          className="text-accent transition-colors"
        >
          <StarIcon filled={n <= display} className={starClass} />
        </button>
      ))}
    </div>
  );
}

function RadarChart({ criteria, averages, labels }) {
  const rootRef = useRef(null);
  const polygonRef = useRef(null);
  const targetFractions = criteria.map((c) => (averages[c] || 0) / 5);

  useEffect(() => {
    const proxy = { t: 0 };
    const st = ScrollTrigger.create({
      trigger: rootRef.current,
      start: "top 88%",
      once: true,
      onEnter: () => {
        gsap.to(proxy, {
          t: 1,
          duration: 1.1,
          ease: "power3.out",
          onUpdate: () => {
            if (polygonRef.current) {
              polygonRef.current.setAttribute("points", pointsAttr(targetFractions.map((f) => f * proxy.t)));
            }
          },
        });
      },
    });
    return () => st.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetFractions.join(",")]);

  const rings = [0.2, 0.4, 0.6, 0.8, 1];

  return (
    <div ref={rootRef} className="relative mx-auto" style={{ width: RADAR_SIZE + 80, height: RADAR_SIZE + 40 }}>
      <svg
        viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
        width={RADAR_SIZE + 80}
        height={RADAR_SIZE + 40}
        className="overflow-visible"
      >
        {rings.map((r) => (
          <polygon
            key={r}
            points={pointsAttr(criteria.map(() => r))}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        ))}
        {criteria.map((_, i) => {
          const [x, y] = axisPoint(i, 1);
          return (
            <line key={i} x1={RADAR_CENTER} y1={RADAR_CENTER} x2={x} y2={y} stroke="var(--color-border)" strokeWidth="1" />
          );
        })}
        <polygon
          ref={polygonRef}
          points={pointsAttr(criteria.map(() => 0))}
          fill="color-mix(in oklch, var(--color-accent) 32%, transparent)"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {criteria.map((c, i) => {
          const [x, y] = axisPoint(i, 1.34);
          return (
            <text
              key={c}
              x={x}
              y={y}
              textAnchor={LABEL_ANCHORS[i]}
              dominantBaseline="middle"
              className="fill-foreground-muted text-[9px] font-medium uppercase tracking-wide"
            >
              {labels[c]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function OverallScore({ overall, count, dict }) {
  const ref = useRef(null);

  useEffect(() => {
    const proxy = { val: 0 };
    const tween = gsap.to(proxy, {
      val: overall,
      duration: 1,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) ref.current.textContent = proxy.val.toFixed(1);
      },
    });
    return () => tween.kill();
  }, [overall]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-baseline gap-1">
        <span
          ref={ref}
          className="bg-[linear-gradient(to_right,var(--color-foreground),var(--color-accent)_60%,var(--color-accent-2))] bg-clip-text font-display text-6xl font-black text-transparent"
        >
          0.0
        </span>
        <span className="text-lg font-semibold text-foreground-muted">/5</span>
      </div>
      <StarPicker value={overall} readOnly size="sm" />
      <p className="mt-2 text-sm text-foreground-muted">
        {count} {dict.reviewsSuffix}
      </p>
    </div>
  );
}

function ReviewCard({ review, criteria, labels, locale, isOwn, dict, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const confirmTimeout = useRef(null);

  useEffect(() => () => clearTimeout(confirmTimeout.current), []);

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true);
      clearTimeout(confirmTimeout.current);
      confirmTimeout.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    onDelete();
  }

  return (
    <li data-review-row className="flex flex-col rounded-2xl border border-border bg-background-elevated/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-background">
            {review.reviewerAvatarUrl ? (
              <Image
                src={review.reviewerAvatarUrl}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
                style={{ objectPosition: review.reviewerAvatarPosition || "50% 50%" }}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-accent">
                {review.reviewerName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </span>
          <div>
            <p className="font-medium">{review.reviewerName}</p>
            <p className="text-xs text-foreground-muted">{formatDate(review.createdAt, locale)}</p>
          </div>
        </div>
        {isOwn && (
          <div className="flex shrink-0 items-center gap-3">
            <button type="button" onClick={onEdit} className="text-xs font-medium text-accent hover:text-accent-2">
              {dict.editReview}
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className={`text-xs font-medium transition-colors ${
                confirming ? "text-red-500" : "text-foreground-muted hover:text-red-500"
              }`}
            >
              {confirming ? dict.confirmDelete : dict.deleteReview}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {criteria.map((c) => (
          <div key={c}>
            <p className="text-[10px] uppercase tracking-wide text-foreground-muted">{labels[c]}</p>
            <StarPicker value={review.criteria[c] || 0} readOnly size="sm" />
          </div>
        ))}
      </div>

      {review.body && <p className="mt-4 whitespace-pre-wrap text-sm text-foreground-muted">{review.body}</p>}
    </li>
  );
}

function RatingForm({ criteria, labels, initial, dict, onCancel, onSubmit, isEditing }) {
  const [values, setValues] = useState(() => Object.fromEntries(criteria.map((c) => [c, initial?.criteria?.[c] || 0])));
  const [body, setBody] = useState(initial?.body || "");
  const [saving, setSaving] = useState(false);

  const complete = criteria.every((c) => values[c] > 0);

  async function handleSubmit() {
    if (!complete || saving) return;
    setSaving(true);
    await onSubmit({ criteria: values, body: body.trim() || null });
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-background-elevated/40 p-6">
      <div className="flex flex-col gap-4">
        {criteria.map((c) => (
          <div key={c} className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{labels[c]}</span>
            <StarPicker value={values[c]} onChange={(n) => setValues((v) => ({ ...v, [c]: n }))} />
          </div>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={dict.reviewPlaceholder}
        rows={3}
        className="mt-5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!complete || saving}
          className="rounded-full bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] px-6 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? dict.submitting : isEditing ? dict.update : dict.submit}
        </button>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-foreground-muted hover:text-foreground">
          {dict.cancel}
        </button>
      </div>
    </div>
  );
}

export function RatingSection({
  targetId,
  targetRole,
  reviews: initialReviews,
  userId,
  viewer,
  locale,
  dict,
  title,
  seeAllLabel,
  seeLessLabel,
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(true);
  const listRef = useRef(null);
  const contentRef = useRef(null);
  const summaryRef = useRef(null);

  const criteria = CRITERIA_BY_ROLE[targetRole] || CRITERIA_BY_ROLE.dj;
  const ownReview = userId ? reviews.find((r) => r.reviewerId === userId) : null;
  const isSelf = userId === targetId;
  const hasMore = !expanded && reviews.length > PREVIEW_COUNT;
  const visibleReviews = hasMore ? reviews.slice(0, PREVIEW_COUNT) : reviews;

  const { averages, overall } = useMemo(() => {
    const sums = Object.fromEntries(criteria.map((c) => [c, 0]));
    let total = 0;
    let count = 0;
    for (const r of reviews) {
      for (const c of criteria) {
        const v = r.criteria[c];
        if (typeof v === "number") {
          sums[c] += v;
          total += v;
          count += 1;
        }
      }
    }
    const avgs = Object.fromEntries(criteria.map((c) => [c, reviews.length ? sums[c] / reviews.length : 0]));
    return { averages: avgs, overall: count ? total / count : 0 };
  }, [reviews, criteria]);

  useEffect(() => {
    if (!listRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-review-row]",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" }
      );
    }, listRef);
    return () => ctx.revert();
  }, [reviews.length, expanded]);

  // "Curtain" wipe reveal on open: the panel clips open top-to-bottom, then
  // the score/radar card pops in with an overshoot ease, then the review
  // cards stagger in behind it — a layered entrance rather than a flat fade.
  useEffect(() => {
    if (!open || !contentRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(
        contentRef.current,
        { clipPath: "inset(0 0 100% 0)", autoAlpha: 0 },
        { clipPath: "inset(0 0 0% 0)", autoAlpha: 1, duration: 0.7, ease: "power4.inOut" }
      )
        .fromTo(
          summaryRef.current,
          { autoAlpha: 0, y: 24, scale: 0.92 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.6)" },
          "-=0.35"
        )
        .fromTo(
          "[data-review-row]",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" },
          "-=0.3"
        );
    }, contentRef);
    return () => ctx.revert();
  }, [open]);

  async function handleSubmit({ criteria: values, body }) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profile_reviews")
      .upsert(
        { reviewer_id: userId, target_id: targetId, criteria: values, body, updated_at: new Date().toISOString() },
        { onConflict: "reviewer_id,target_id" }
      )
      .select("id, created_at")
      .single();

    if (error) {
      setFormError(true);
      return;
    }
    setFormError(false);

    setReviews((current) => {
      const withoutOwn = current.filter((r) => r.reviewerId !== userId);
      return [
        {
          id: data?.id || ownReview?.id,
          reviewerId: userId,
          reviewerName: ownReview?.reviewerName || viewer?.name,
          reviewerAvatarUrl: ownReview?.reviewerAvatarUrl || viewer?.avatarUrl || null,
          reviewerAvatarPosition: ownReview?.reviewerAvatarPosition || viewer?.avatarPosition || null,
          criteria: values,
          body,
          createdAt: ownReview?.createdAt || data?.created_at || new Date().toISOString(),
        },
        ...withoutOwn,
      ];
    });
    setFormOpen(false);
  }

  async function handleDelete() {
    if (!ownReview) return;
    const supabase = createClient();
    const { error } = await supabase.from("profile_reviews").delete().eq("id", ownReview.id);
    if (error) {
      setFormError(true);
      return;
    }
    setFormError(false);
    setReviews((current) => current.filter((r) => r.id !== ownReview.id));
    setFormOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{title}</p>
        <div className="flex items-center gap-4">
          {open && userId && !isSelf && !formOpen && (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="text-xs font-semibold uppercase tracking-wide text-accent hover:text-accent-2"
            >
              {ownReview ? dict.editReview : dict.writeReview}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent hover:text-accent-2"
          >
            {open ? dict.hideReviews : dict.viewReviews}
            <ChevronRightIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div ref={contentRef}>
          <div
            ref={summaryRef}
            className="mt-6 flex flex-col items-center gap-8 rounded-2xl border border-border bg-background-elevated/20 p-8 sm:flex-row sm:justify-center sm:gap-16"
          >
            <OverallScore overall={overall} count={reviews.length} dict={dict} />
            <RadarChart criteria={criteria} averages={averages} labels={dict.criteria} />
          </div>

          {!userId && (
            <p className="mt-6 text-center text-sm text-foreground-muted">{dict.loginToReview}</p>
          )}

          {formOpen && (
            <div className="mt-6">
              {formError && <p className="mb-3 text-center text-sm text-red-500">{dict.errorGeneric}</p>}
              <RatingForm
                criteria={criteria}
                labels={dict.criteria}
                initial={ownReview}
                dict={dict}
                isEditing={Boolean(ownReview)}
                onCancel={() => setFormOpen(false)}
                onSubmit={handleSubmit}
              />
              {ownReview && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-foreground-muted hover:text-red-500"
                >
                  <CloseIcon className="h-3 w-3" /> {dict.deleteReview}
                </button>
              )}
            </div>
          )}

          <ul ref={listRef} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                criteria={criteria}
                labels={dict.criteria}
                locale={locale}
                isOwn={review.reviewerId === userId}
                dict={dict}
                onEdit={() => setFormOpen(true)}
                onDelete={handleDelete}
              />
            ))}
            {hasMore && (
              <li>
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="group flex h-full min-h-32 w-full flex-col items-center justify-center gap-1 rounded-2xl bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] text-white transition-transform duration-300 hover:scale-[1.02]"
                >
                  <span className="font-display text-2xl font-bold">+{reviews.length - PREVIEW_COUNT}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-90 transition-transform group-hover:translate-x-0.5">
                    {seeAllLabel} →
                  </span>
                </button>
              </li>
            )}
          </ul>

          {expanded && reviews.length > PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="mt-4 text-sm font-semibold text-accent hover:text-accent-2"
            >
              ← {seeLessLabel}
            </button>
          )}

          {reviews.length === 0 && (
            <p className="mt-8 text-center text-foreground-muted">{isSelf ? dict.emptyOwn : dict.empty}</p>
          )}
        </div>
      )}
    </div>
  );
}
