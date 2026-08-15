import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../dictionaries";
import { RankingBoard } from "@/components/ranking-board";

// Deterministic pseudo-random tiebreak — stable across requests/re-sorts
// since it only depends on each profile's id, matching the pattern already
// used to order the DJs listing page.
function seedOf(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return hash;
}

function rankSort(a, b) {
  return b.votes - a.votes || a.tiebreak - b.tiebreak;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return { title: dict.ranking.title, description: dict.ranking.subtitle };
}

export default async function RankingPage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: djProfiles },
    { data: djDetails },
    { data: clubProfiles },
    { data: clubDetails },
    { data: voteCounts },
    { data: ownVotes },
  ] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url, avatar_position").eq("role", "dj"),
    supabase.from("dj_profiles").select("id, stage_name, location, sound_profile"),
    supabase.from("profiles").select("id, display_name, avatar_url, avatar_position").eq("role", "club"),
    supabase.from("club_profiles").select("id, name, location, venue_type"),
    supabase.from("profile_vote_counts").select("target_id, votes"),
    user
      ? supabase.from("profile_votes").select("target_id").eq("voter_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const voteCountById = new Map((voteCounts || []).map((v) => [v.target_id, v.votes]));
  const votedIds = new Set((ownVotes || []).map((v) => v.target_id));
  const djDetailById = new Map((djDetails || []).map((d) => [d.id, d]));
  const clubDetailById = new Map((clubDetails || []).map((c) => [c.id, c]));

  const djs = (djProfiles || [])
    .map((p) => {
      const d = djDetailById.get(p.id);
      const genre = d?.sound_profile?.split(",")[0]?.trim();
      return {
        id: p.id,
        displayName: p.display_name,
        name: d?.stage_name || p.display_name,
        avatarUrl: p.avatar_url,
        avatarPosition: p.avatar_position,
        meta: [genre, d?.location].filter(Boolean).join(" · "),
        votes: voteCountById.get(p.id) || 0,
        hasVoted: votedIds.has(p.id),
        tiebreak: seedOf(p.id),
      };
    })
    .sort(rankSort);

  const clubs = (clubProfiles || [])
    .map((p) => {
      const c = clubDetailById.get(p.id);
      return {
        id: p.id,
        displayName: p.display_name,
        name: c?.name || p.display_name,
        avatarUrl: p.avatar_url,
        avatarPosition: p.avatar_position,
        meta: [c?.venue_type, c?.location].filter(Boolean).join(" · "),
        votes: voteCountById.get(p.id) || 0,
        hasVoted: votedIds.has(p.id),
        tiebreak: seedOf(p.id),
      };
    })
    .sort(rankSort);

  return <RankingBoard djs={djs} clubs={clubs} locale={locale} userId={user?.id ?? null} dict={dict.ranking} />;
}
