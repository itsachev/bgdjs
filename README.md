# Bulgarian DJ Community

A community site for Bulgarian DJs, clubs, and fans — profiles, events, and mixes in one place.

## Stack

- **Next.js 16** (App Router, JavaScript, Turbopack) — deployed on Vercel
- **Supabase** — auth, Postgres, storage (images)
- **Custom admin CMS** at `/admin` — single-operator content management, no third-party CMS
- **DJ mixes** are embedded via SoundCloud/Mixcloud rather than self-hosted, to avoid audio storage/bandwidth costs
- **GSAP + Lenis** for animation and smooth scroll
- **Manual i18n** (`bg`/`en`) via a `[locale]` route segment and `proxy.js` — no i18n library
- **Tailwind CSS v4**, class-based dark/light theme via `next-themes`

## Roles

Four roles live in `public.profiles.role` (see [`supabase/schema.sql`](./supabase/schema.sql)): `fan`, `dj`, `club`, `admin`. The `/admin` route and its nav link are only reachable when the logged-in user's role is `admin`.

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key.
2. Run the schema in `supabase/schema.sql` against your Supabase project (SQL Editor or `supabase db push`).
3. Promote your own account to `admin` (see the comment at the bottom of `schema.sql`).
4. Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/bg` or `/en` based on your browser language.

## Project layout

- `app/[locale]/` — all routes, localized via the `locale` param (`bg` | `en`)
- `dictionaries/` — `bg.json` / `en.json` translation strings
- `proxy.js` — locale detection and redirect (Next.js 16's replacement for `middleware.js`)
- `lib/supabase/` — browser and server Supabase clients
- `lib/auth.js` — current-user/role helpers
- `supabase/schema.sql` — database schema and RLS policies
- `components/` — shared UI (header, footer, theme toggle, waveform, smooth scroll provider)

See [`progress.md`](./progress.md) for what's built and what's next.
