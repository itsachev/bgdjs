-- Migration: adds direct messaging between DJs and clubs (conversations +
-- messages tables with RLS). Run once in the Supabase SQL Editor. Safe to
-- re-run — table creation is guarded with `if not exists`.

-- A conversation is the unique, order-independent pair of its two
-- participants; canonical ordering (participant_one_id < participant_two_id)
-- is enforced so the app can always look a conversation up by a sorted id
-- pair instead of needing an OR-based query. Only DJs and clubs can start
-- one with each other — same role restriction as profile_votes/
-- profile_reviews. Messaging itself is free for every DJ/club today; if it
-- becomes a paid feature later, the gate belongs in application code (see
-- canUseMessaging() in lib/auth.js) rather than here, so RLS keeps
-- enforcing "who this data structurally belongs to" while the product/
-- business rule lives in one JS function.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one_id uuid not null references public.profiles (id) on delete cascade,
  participant_two_id uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (participant_one_id, participant_two_id),
  constraint conversations_ordered_pair check (participant_one_id < participant_two_id)
);

alter table public.conversations enable row level security;

create policy "Participants can view their conversations"
  on public.conversations for select
  using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

create policy "DJs and clubs can start a conversation with each other"
  on public.conversations for insert
  with check (
    auth.uid() in (participant_one_id, participant_two_id)
    and exists (select 1 from public.profiles where id = participant_one_id and role in ('dj', 'club'))
    and exists (select 1 from public.profiles where id = participant_two_id and role in ('dj', 'club'))
  );

create policy "Participants can update their conversation's activity timestamp"
  on public.conversations for update
  using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

-- Individual messages within a conversation. Visible only to its two
-- participants; only the sender can insert on their own behalf, and only
-- into a conversation they actually belong to.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.messages enable row level security;

create policy "Participants can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );

create policy "Participants can send messages in their conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );

create policy "Participants can mark messages as read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );
