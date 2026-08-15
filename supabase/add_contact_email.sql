-- Migration: adds the optional public contact_email column to dj_profiles,
-- backing the new "Contact me" section on the DJ profile page. Run once in
-- the Supabase SQL Editor. Safe to re-run.

alter table public.dj_profiles add column if not exists contact_email text;
