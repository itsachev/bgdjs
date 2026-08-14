-- Bulgarian DJ Community — initial schema
-- Run against a fresh Supabase project (SQL Editor or `supabase db push`).

create type public.user_role as enum ('fan', 'dj', 'club', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'fan',
  display_name text not null unique,
  avatar_url text,
  avatar_position text,
  bio text,
  city text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- Keep in sync with auth.users on signup.
-- Role is read from user-supplied metadata but restricted to the self-service
-- roles (fan/dj/club) — 'admin' can never be granted this way.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    case
      when requested_role in ('fan', 'dj', 'club') then requested_role::public.user_role
      else 'fan'
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- The policy above lets a user update their own row, but role must stay
-- fixed from the client side — otherwise anyone could set role = 'admin'
-- on themselves. This trigger reverts any role change made as the
-- 'authenticated' Postgres role (i.e. via the client libraries/Data API).
-- Changes made from the SQL Editor or with the service_role key run as a
-- different Postgres role and are unaffected, so admin promotion still works.
create function public.prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() = 'authenticated' then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger enforce_role_immutable
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_escalation();

-- Promote a user to admin manually, e.g.:
-- update public.profiles set role = 'admin' where id = '<your-auth-user-id>';

-- auth.users isn't publicly readable, so the sign-up form can't check email
-- availability directly. This function exposes only a yes/no answer — no
-- other user data — for the live-availability check on the sign-up form.
create function public.email_exists(check_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from auth.users where email = check_email);
$$;

grant execute on function public.email_exists(text) to anon, authenticated;

-- Hero section content, editable via the admin CMS. Singleton row (id = 1).
create table public.hero_content (
  id smallint primary key default 1,
  title_bg text,
  title_en text,
  media_url text,
  media_path text,
  media_type text check (media_type in ('image', 'video')),
  updated_at timestamptz not null default now(),
  constraint hero_content_singleton check (id = 1)
);

insert into public.hero_content (id) values (1);

alter table public.hero_content enable row level security;

create policy "Hero content is viewable by everyone"
  on public.hero_content for select
  using (true);

create policy "Admins can update hero content"
  on public.hero_content for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Storage bucket for hero background image/video uploads. Public so the
-- homepage can render the media directly without signed URLs.
insert into storage.buckets (id, name, public)
values ('hero', 'hero', true)
on conflict (id) do nothing;

create policy "Admins can upload hero media"
  on storage.objects for insert
  with check (
    bucket_id = 'hero'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update hero media"
  on storage.objects for update
  using (
    bucket_id = 'hero'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete hero media"
  on storage.objects for delete
  using (
    bucket_id = 'hero'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Login page background content, editable via the admin CMS. Singleton row (id = 1).
create table public.login_content (
  id smallint primary key default 1,
  media_url text,
  media_path text,
  media_type text check (media_type in ('image', 'video')),
  updated_at timestamptz not null default now(),
  constraint login_content_singleton check (id = 1)
);

insert into public.login_content (id) values (1);

alter table public.login_content enable row level security;

create policy "Login content is viewable by everyone"
  on public.login_content for select
  using (true);

create policy "Admins can update login content"
  on public.login_content for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Storage bucket for login background image/video uploads. Public so the
-- login page can render the media directly without signed URLs.
insert into storage.buckets (id, name, public)
values ('login', 'login', true)
on conflict (id) do nothing;

create policy "Admins can upload login media"
  on storage.objects for insert
  with check (
    bucket_id = 'login'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update login media"
  on storage.objects for update
  using (
    bucket_id = 'login'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete login media"
  on storage.objects for delete
  using (
    bucket_id = 'login'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Site-wide background audio track, editable via the admin CMS. Singleton row (id = 1).
create table public.site_audio (
  id smallint primary key default 1,
  title text,
  media_url text,
  media_path text,
  updated_at timestamptz not null default now(),
  constraint site_audio_singleton check (id = 1)
);

insert into public.site_audio (id) values (1);

alter table public.site_audio enable row level security;

create policy "Site audio is viewable by everyone"
  on public.site_audio for select
  using (true);

create policy "Admins can update site audio"
  on public.site_audio for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Storage bucket for the site audio track. Public so it can be streamed
-- directly without signed URLs.
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

create policy "Admins can upload site audio"
  on storage.objects for insert
  with check (
    bucket_id = 'audio'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update site audio file"
  on storage.objects for update
  using (
    bucket_id = 'audio'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete site audio file"
  on storage.objects for delete
  using (
    bucket_id = 'audio'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- DJ- and club-specific profile fields. 1:1 extension of public.profiles,
-- only populated for accounts with the matching role. A row's existence
-- (with sound_profile set, its one required field) marks that profile as
-- "complete" for the sign-in redirect gate.
create table public.dj_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  stage_name text,
  gender text,
  social_links text,
  website text,
  location text,
  years_active integer,
  sound_profile text not null,
  updated_at timestamptz not null default now()
);

alter table public.dj_profiles enable row level security;

create policy "DJ profiles are viewable by everyone"
  on public.dj_profiles for select
  using (true);

create policy "DJs can create their own DJ profile"
  on public.dj_profiles for insert
  with check (
    auth.uid() = id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'dj')
  );

create policy "DJs can update their own DJ profile"
  on public.dj_profiles for update
  using (auth.uid() = id);

create table public.club_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  name text,
  description text,
  venue_type text,
  location text,
  website text,
  resident_dj text,
  sound_profile text not null,
  genre text,
  social_links text,
  capacity integer,
  reservation_contact text,
  updated_at timestamptz not null default now()
);

alter table public.club_profiles enable row level security;

create policy "Club profiles are viewable by everyone"
  on public.club_profiles for select
  using (true);

create policy "Clubs can create their own club profile"
  on public.club_profiles for insert
  with check (
    auth.uid() = id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'club')
  );

create policy "Clubs can update their own club profile"
  on public.club_profiles for update
  using (auth.uid() = id);

-- Storage bucket for profile avatars (DJ/club/fan). Public so avatars render
-- without signed URLs. Any authenticated user may upload; only the uploader
-- (tracked via the auto-set `owner` column) may replace or delete their file.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload an avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and owner = auth.uid());

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and owner = auth.uid());
