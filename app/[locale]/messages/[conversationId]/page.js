import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../../dictionaries";
import { getCurrentProfile, canUseMessaging } from "@/lib/auth";
import { otherParticipantId } from "@/lib/messaging";
import { MessageThread } from "@/components/message-thread";
import { AmbientGlow } from "@/components/ambient-glow";

export default async function ConversationPage({ params }) {
  const { locale, conversationId } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/messages/${conversationId}`)}`);
  }

  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, participant_one_id, participant_two_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) notFound();

  const isParticipant =
    conversation.participant_one_id === profile.id || conversation.participant_two_id === profile.id;
  if (!isParticipant) notFound();

  const otherId = otherParticipantId(conversation, profile.id);
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, role, display_name, avatar_url, avatar_position")
    .eq("id", otherId)
    .maybeSingle();

  let otherName = otherProfile?.display_name || "—";
  if (otherProfile?.role === "dj") {
    const { data: dj } = await supabase.from("dj_profiles").select("stage_name").eq("id", otherId).maybeSingle();
    otherName = dj?.stage_name || otherName;
  } else if (otherProfile?.role === "club") {
    const { data: club } = await supabase.from("club_profiles").select("name").eq("id", otherId).maybeSingle();
    otherName = club?.name || otherName;
  }

  const otherHref =
    otherProfile?.role === "dj"
      ? `/${locale}/djs/${encodeURIComponent(otherProfile.display_name)}`
      : otherProfile?.role === "club"
        ? `/${locale}/clubs/${encodeURIComponent(otherProfile.display_name)}`
        : null;

  // Opening the thread is how a recipient acknowledges it — mark whatever
  // the other participant sent that we haven't seen yet as read.
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversation.id)
    .neq("sender_id", profile.id)
    .is("read_at", null);

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  return (
    <div className="relative flex-1 overflow-hidden">
      <AmbientGlow variant="profile" />

      <div className="relative mx-auto max-w-2xl px-6 py-16">
        <Link
          href={`/${locale}/messages`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-accent"
        >
          {dict.messageThread.backToInbox}
        </Link>

        <MessageThread
          conversationId={conversation.id}
          viewerId={profile.id}
          otherName={otherName}
          otherHref={otherHref}
          otherAvatarUrl={otherProfile?.avatar_url}
          otherAvatarPosition={otherProfile?.avatar_position}
          initialMessages={messages || []}
          canSend={canUseMessaging(profile.role)}
          locale={locale}
          dict={dict.messageThread}
        />
      </div>
    </div>
  );
}
