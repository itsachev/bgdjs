# Progress

## Stack decisions

- Next.js 16 (App Router, JavaScript — no TypeScript), pnpm
- Supabase (Postgres + Auth + Storage) — free tier to start, upgrade path to Pro as usage grows
- Custom admin CMS instead of Sanity/Payload (single-operator use case)
- DJ mixes embedded via SoundCloud/Mixcloud, not self-hosted (avoids audio storage/bandwidth cost)
- Manual i18n (`bg`/`en`) instead of a library, to sidestep Next 16 compatibility risk
- GSAP + Lenis for animation and smooth scroll
- Dark-first "Waveform"-inspired club aesthetic, dark forced as default (system preference disabled)
- Four roles: `fan`, `dj`, `club`, `admin`
- Login/signup are full pages, not modals (an intercepting-routes modal version was built and then reverted per request)

## Done

- [x] Next.js app scaffolded (JS, App Router, Tailwind v4, ESLint, Turbopack)
- [x] `[locale]` routing with JSON dictionaries (`bg` default, `en` supported)
- [x] Dark/light theme via `next-themes` (dark forced by default), club color palette in `globals.css`
- [x] Lenis + GSAP `ScrollTrigger` wired together via `SmoothScrollProvider`
- [x] Supabase browser + server clients (`lib/supabase/`), `lib/auth.js` (`getCurrentProfile()` / `isAdmin()`)
- [x] Site header (active nav states, locale switcher, theme toggle, login/signup buttons or user menu) and footer, wider `max-w-7xl` containers throughout
- [x] Homepage hero: GSAP entrance animation, scroll-scrubbed parallax background, gradient title text, CMS-editable background image/video (admin-uploadable, falls back to a radial gradient)
- [x] `/login` and `/signup` pages: widened forms, gradient titles, CMS-editable backgrounds (fall back to gradient blobs + waveform texture), live display-name/email availability checks (debounced), role picker (fan/dj/club)
- [x] Post-auth redirect: incomplete DJ/club profiles are sent to `/profile/complete` instead of home
- [x] Profile-completion form: avatar upload with drag-to-reposition (saved per-photo, applied everywhere that avatar renders as a circle or as the profile-page background), "Describe yourself" bio, years-active (DJ)/venue-type pills (club), sound-profile genre picker, dedicated "Where to find you online" section with 6 brand-colored social platform fields (Instagram/Facebook/TikTok/SoundCloud/Mixcloud/YouTube), unsaved-draft persistence via `localStorage`
- [x] `/djs` and `/clubs` directory pages: debounced locale-aware search, quick genre filter pills, pagination (20/page), completeness-based ranking on `/djs`, hover-only (desktop-only, `@media (hover:hover)` gated) animated card backgrounds, online-now presence indicator (heartbeat-driven `last_seen_at`, green dot + hover tooltip)
- [x] Public DJ/club profile pages (`/djs/[slug]`, `/clubs/[slug]`): two-column desktop layout, dimmed background photo, icon-labeled stat cards, social platform pill links, SEO metadata (dynamic title/description)
- [x] Site-wide background audio player: admin-uploadable MP3 + title, autoplay muted + looped, bottom-right pill with mute/unmute toggle, hidden entirely when no track is set
- [x] `/admin` route (role-gated, 404s otherwise): Hero section editor, Login background editor, Signup background editor, Site audio editor
- [x] SEO metadata across all public pages; `robots: noindex` on private pages (`/admin`, `/profile/complete`)
- [x] `next/image` used for every non-admin image (avatars, profile photos, listing cards, hero/login/signup backgrounds); `next.config.mjs` `remotePatterns` derived from the Supabase URL
- [x] 40 dummy DJ profiles seeded (`supabase/seed_djs.sql`) for populating the directory during development
- [x] Bug fixes: percent-encoded profile slugs 404ing, logging out from a protected page (e.g. `/admin`) landing on a stuck 404 instead of home

## Next up

- [ ] Events: data model + admin CRUD + public listing (still a placeholder grid on the homepage)
- [ ] Dummy seed data for clubs (only DJs have seeded rows so far)
- [ ] Admin CMS screens for managing individual DJ/club/event records (current admin page only covers site-wide content: hero, login/signup backgrounds, audio)
- [ ] Mixes (out of scope for now — revisit later if wanted)
- [ ] Deploy: Vercel (app) + Supabase (Pro tier once traffic justifies it)
