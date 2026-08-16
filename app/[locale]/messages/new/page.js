import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasLocale } from "../../dictionaries";
import { getCurrentProfile, canUseMessaging } from "@/lib/auth";
import { orderedParticipantIds } from "@/lib/messaging";

// Find-or-create endpoint: /messages/new?with=<profileId>. Never rendered —
// always redirects, either back to login (preserving this URL as `next`) or
// straight into the resulting conversation thread.
export default async function NewConversationPage({ params, searchParams }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  const { with: targetId } = await searchParams;
  const currentPath = `/${locale}/messages/new${targetId ? `?with=${targetId}` : ""}`;

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/${locale}/login?next=${encodeURIComponent(currentPath)}`);
  }

  if (!targetId || targetId === profile.id || !canUseMessaging(profile.role)) {
    redirect(`/${locale}/messages`);
  }

  const supabase = await createClient();
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", targetId)
    .maybeSingle();

  if (!targetProfile || !canUseMessaging(targetProfile.role)) {
    redirect(`/${locale}/messages`);
  }

  const [participantOneId, participantTwoId] = orderedParticipantIds(profile.id, targetProfile.id);

  const { data: conversation } = await supabase
    .from("conversations")
    .upsert(
      { participant_one_id: participantOneId, participant_two_id: participantTwoId },
      { onConflict: "participant_one_id,participant_two_id" }
    )
    .select("id")
    .single();

  if (!conversation) {
    redirect(`/${locale}/messages`);
  }

  redirect(`/${locale}/messages/${conversation.id}`);
}
