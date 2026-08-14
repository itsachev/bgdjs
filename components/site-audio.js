import { createClient } from "@/lib/supabase/server";
import { SiteAudioPlayer } from "@/components/site-audio-player";

export async function SiteAudio() {
  const supabase = await createClient();
  const { data: audio } = await supabase.from("site_audio").select("title, media_url").eq("id", 1).maybeSingle();

  return <SiteAudioPlayer title={audio?.title} mediaUrl={audio?.media_url} />;
}
