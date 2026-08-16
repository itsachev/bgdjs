// A conversation stores its two participants in canonical id order
// (participant_one_id < participant_two_id, enforced by a DB constraint) so
// it can be looked up by a sorted pair instead of an OR query. These two
// helpers keep that ordering logic in one place.
export function orderedParticipantIds(a, b) {
  return a < b ? [a, b] : [b, a];
}

export function otherParticipantId(conversation, viewerId) {
  return conversation.participant_one_id === viewerId
    ? conversation.participant_two_id
    : conversation.participant_one_id;
}

// Total unread messages across all of a profile's conversations — messages
// the other participant sent that this profile hasn't opened yet. Used for
// the header's unread badge. Takes an already-created Supabase client so it
// works with either the server or browser client.
export async function getUnreadMessageCount(supabase, profileId) {
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .or(`participant_one_id.eq.${profileId},participant_two_id.eq.${profileId}`);

  const conversationIds = (conversations || []).map((c) => c.id);
  if (conversationIds.length === 0) return 0;

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", conversationIds)
    .neq("sender_id", profileId)
    .is("read_at", null);

  return count || 0;
}
