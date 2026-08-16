import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../dictionaries";
import { getCurrentProfile, canUseMessaging } from "@/lib/auth";
import { otherParticipantId } from "@/lib/messaging";
import { AmbientGlow } from "@/components/ambient-glow";
import { Kicker } from "@/components/kicker";

function formatConversationDate(isoString, locale) {
  const date = new Date(isoString);
  const intlLocale = locale === "bg" ? "bg-BG" : "en-GB";
  return new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short" }).format(date);
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return { title: dict.messages.title, description: dict.messages.subtitle };
}

export default async function MessagesPage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.messages;

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/messages`)}`);
  }

  if (!canUseMessaging(profile.role)) {
    return (
      <div className="relative flex-1 overflow-hidden">
        <AmbientGlow variant="directory" />
        <div className="relative mx-auto max-w-2xl px-6 py-16 text-center">
          <div className="flex justify-center">
            <Kicker>{dict.nav.messages}</Kicker>
          </div>
          <h1 className="mt-3 font-display text-display-2 font-bold tracking-tight">{t.title}</h1>
          <p className="mt-4 text-foreground-muted">{t.ineligible}</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, participant_one_id, participant_two_id, last_message_at")
    .or(`participant_one_id.eq.${profile.id},participant_two_id.eq.${profile.id}`)
    .order("last_message_at", { ascending: false });

  const list = conversations || [];
  const otherIds = [...new Set(list.map((c) => otherParticipantId(c, profile.id)))];

  const { data: otherProfiles } = otherIds.length
    ? await supabase.from("profiles").select("id, role, display_name, avatar_url, avatar_position").in("id", otherIds)
    : { data: [] };
  const otherProfileById = new Map((otherProfiles || []).map((p) => [p.id, p]));

  const { data: djDetails } = otherIds.length
    ? await supabase.from("dj_profiles").select("id, stage_name").in("id", otherIds)
    : { data: [] };
  const { data: clubDetails } = otherIds.length
    ? await supabase.from("club_profiles").select("id, name").in("id", otherIds)
    : { data: [] };
  const djNameById = new Map((djDetails || []).map((d) => [d.id, d.stage_name]));
  const clubNameById = new Map((clubDetails || []).map((c) => [c.id, c.name]));

  const conversationIds = list.map((c) => c.id);
  const { data: allMessages } = conversationIds.length
    ? await supabase
        .from("messages")
        .select("conversation_id, sender_id, body, created_at, read_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const lastMessageByConversation = new Map();
  const unreadByConversation = new Map();
  for (const m of allMessages || []) {
    if (!lastMessageByConversation.has(m.conversation_id)) {
      lastMessageByConversation.set(m.conversation_id, m);
    }
    if (m.sender_id !== profile.id && !m.read_at) {
      unreadByConversation.set(m.conversation_id, (unreadByConversation.get(m.conversation_id) || 0) + 1);
    }
  }

  const items = list.map((c) => {
    const otherId = otherParticipantId(c, profile.id);
    const other = otherProfileById.get(otherId);
    const name = djNameById.get(otherId) || clubNameById.get(otherId) || other?.display_name || "—";
    const lastMessage = lastMessageByConversation.get(c.id);
    return {
      id: c.id,
      name,
      avatarUrl: other?.avatar_url,
      avatarPosition: other?.avatar_position,
      lastMessageBody: lastMessage?.body || "",
      lastMessageAt: lastMessage?.created_at || c.last_message_at,
      unread: unreadByConversation.get(c.id) || 0,
    };
  });

  return (
    <div className="relative flex-1 overflow-hidden">
      <AmbientGlow variant="directory" />

      <div className="relative mx-auto max-w-3xl px-6 py-16">
        <Kicker>{dict.nav.messages}</Kicker>
        <h1 className="mt-3 font-display text-display-2 font-bold tracking-tight">{t.title}</h1>
        <p className="mt-4 text-foreground-muted">{t.subtitle}</p>

        {items.length === 0 ? (
          <p className="mt-16 text-foreground-muted">{t.empty}</p>
        ) : (
          <ul className="mt-10 flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/${locale}/messages/${item.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-background-elevated/60"
                >
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-background-elevated">
                    {item.avatarUrl ? (
                      <Image
                        src={item.avatarUrl}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                        style={{ objectPosition: item.avatarPosition || "50% 50%" }}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-accent">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-display font-semibold tracking-tight">{item.name}</span>
                      <span className="shrink-0 text-xs text-foreground-muted">
                        {formatConversationDate(item.lastMessageAt, locale)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-foreground-muted">{item.lastMessageBody}</span>
                      {item.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">
                          {item.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
