-- Migration: enables Supabase Realtime on the messages table, so a new
-- message can push a live update (append to an open thread, bump the
-- header's unread badge) instead of requiring a page refresh. Run once in
-- the Supabase SQL Editor, after add_messaging.sql. Safe to re-run — the
-- publication membership check below skips the ALTER if it's already set.
--
-- RLS on `messages` already restricts each subscribing client to rows from
-- their own conversations, so no extra Realtime-specific policy is needed:
-- the same "Participants can view messages in their conversations" policy
-- governs which INSERTs get pushed to which client.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
