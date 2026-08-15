import { createClient } from "@/lib/supabase/server";
import { BULGARIAN_CITIES } from "@/lib/bulgarian-cities";

const RESULT_LIMIT = 10;

// Lets a search match a city regardless of which locale the club's stored
// canonical value ("Sofia") vs. the query ("София") happen to be in.
const CITY_LABELS = new Map(
  BULGARIAN_CITIES.map((city) => [
    city.value,
    [city.value, city.en, city.bg].map((s) => s.toLowerCase()),
  ])
);

function cityMatches(location, needle) {
  if (!location) return false;
  const labels = CITY_LABELS.get(location) || [location.toLowerCase()];
  return labels.some((label) => label.includes(needle));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  if (!query) return Response.json({ results: [] });

  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, avatar_position")
    .eq("role", "club");

  const { data: clubProfiles } = await supabase
    .from("club_profiles")
    .select("id, name, location");

  const clubById = new Map((clubProfiles || []).map((c) => [c.id, c]));

  const results = (profiles || [])
    .map((p) => ({ ...p, club: clubById.get(p.id) }))
    .filter(
      ({ display_name, club }) =>
        display_name.toLowerCase().includes(query) ||
        club?.name?.toLowerCase().includes(query) ||
        cityMatches(club?.location, query)
    )
    .slice(0, RESULT_LIMIT)
    .map(({ id, display_name, avatar_url, avatar_position, club }) => ({
      id,
      name: club?.name || display_name,
      slug: display_name,
      avatar_url,
      avatar_position,
    }));

  return Response.json({ results });
}
