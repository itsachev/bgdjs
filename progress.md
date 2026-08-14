# Progress

## Stack decisions

- Next.js 16 (App Router, JavaScript — no TypeScript), pnpm
- Supabase (Postgres + Auth + Storage) — free tier to start, upgrade path to Pro as usage grows
- Custom admin CMS instead of Sanity/Payload (single-operator use case)
- DJ mixes embedded via SoundCloud/Mixcloud, not self-hosted (avoids audio storage/bandwidth cost)
- Manual i18n (`bg`/`en`) instead of a library, to sidestep Next 16 compatibility risk
- GSAP + Lenis for animation and smooth scroll
- Dark-first "Waveform"-inspired club aesthetic, light theme as secondary toggle (`next-themes`)
- Four roles: `fan`, `dj`, `club`, `admin`

## Done

- [x] Next.js app scaffolded (JS, App Router, Tailwind v4, ESLint, Turbopack)
- [x] `pnpm` deps installed: `gsap`, `lenis`, `@supabase/supabase-js`, `@supabase/ssr`, `next-themes`
- [x] `[locale]` routing with `proxy.js` redirect (`bg` default, `en` supported) and JSON dictionaries
- [x] Dark/light theme via `next-themes`, club color palette in `globals.css`
- [x] Lenis + GSAP `ScrollTrigger` wired together via `SmoothScrollProvider`
- [x] Supabase browser + server clients (`lib/supabase/`)
- [x] `supabase/schema.sql`: `profiles` table with `role` enum (`fan`/`dj`/`club`/`admin`), auto-provision trigger on signup (role whitelisted to fan/dj/club — never settable to admin via signup), trigger blocking self-service role escalation on update, RLS policies
- [x] `lib/auth.js`: `getCurrentProfile()` / `isAdmin()` helpers
- [x] Site header/footer, locale switcher, theme toggle, animated waveform component
- [x] Homepage: hero with GSAP entrance animation + waveform, placeholder sections for DJs/Clubs/Events
- [x] `/admin` route — 404s unless the logged-in user's role is `admin`; nav link only renders for admins
- [x] `/login` page (email/password via Supabase Auth)
- [x] `/signup` page (email/password/display name + fan/dj/club role picker, cross-linked with `/login`)
- [x] Supabase project created (`bulgarian_dj_community`), `.env.local` populated with URL + publishable key

## Next up

- [ ] Run `schema.sql` against the Supabase project (SQL Editor), then sign up through the app and promote that account to `admin` via SQL
- [ ] DJ and club profile pages + directory listing (replacing placeholder grids)
- [ ] Events: data model + admin CRUD + public listing
- [ ] Image upload (avatars, event/club photos) via Supabase Storage
- [ ] Admin CMS screens: manage DJs, clubs, events
- [ ] Mixes (removed from scope for now — revisit later if wanted)
- [ ] Design pass once style reference research is finalized (currently: dark club aesthetic inspired by Framer's "Waveform" template)
- [ ] Deploy: Vercel (app) + Supabase (Pro tier once traffic justifies it)
