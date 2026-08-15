import { createClient } from "@/lib/supabase/server";
import { BULGARIAN_CITIES } from "@/lib/bulgarian-cities";

const RESULT_LIMIT = 10;

// Lets a search match a city regardless of which locale the DJ's stored
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
    .eq("role", "dj");

  const { data: djProfiles } = await supabase
    .from("dj_profiles")
    .select("id, stage_name, location");

  const djById = new Map((djProfiles || []).map((d) => [d.id, d]));

  const results = (profiles || [])
    .map((p) => ({ ...p, dj: djById.get(p.id) }))
    .filter(
      ({ display_name, dj }) =>
        display_name.toLowerCase().includes(query) ||
        dj?.stage_name?.toLowerCase().includes(query) ||
        cityMatches(dj?.location, query)
    )
    .slice(0, RESULT_LIMIT)
    .map(({ id, display_name, avatar_url, avatar_position, dj }) => ({
      id,
      name: dj?.stage_name || display_name,
      slug: display_name,
      avatar_url,
      avatar_position,
    }));

  return Response.json({ results });
}
