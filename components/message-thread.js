"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { SendIcon } from "@/components/icons";
import { useUnreadMessages } from "@/components/unread-messages-provider";

function formatMessageTime(isoString, locale) {
  const date = new Date(isoString);
  const intlLocale = locale === "bg" ? "bg-BG" : "en-GB";
  return new Intl.DateTimeFormat(intlLocale, { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function MessageThread({
  conversationId,
  viewerId,
  otherName,
  otherHref,
  otherAvatarUrl,
  otherAvatarPosition,
  initialMessages,
  canSend,
  locale,
  dict,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const { refreshUnreadCount } = useUnreadMessages();

  // The server already marked this conversation's messages read during the
  // page's own render — resync the header badge to match right away instead
  // of waiting for the next full navigation.
  useEffect(() => {
    refreshUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Live updates for this thread: a message the other participant sends
  // while it's open appears without a refresh. RLS already limits delivery
  // to this conversation's participants; the `filter` here just avoids
  // paying for events from every other conversation on the site too.
  useEffect(() => {
    const supabase = createClient();
    let channel;
    let cancelled = false;

    async function subscribe() {
      // See the matching comment in unread-messages-provider.js — the
      // socket needs the session's JWT before subscribing, or RLS treats it
      // as anonymous and silently drops every event.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`conversation-${conversationId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
          (payload) => {
            setMessages((current) =>
              current.some((m) => m.id === payload.new.id) ? current : [...current, payload.new]
            );

            if (payload.new.sender_id !== viewerId) {
              supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", payload.new.id);
              refreshUnreadCount();
            }
          }
        )
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(
              "Conversation realtime subscription failed — is `messages` added to the supabase_realtime publication? (see supabase/add_messaging_realtime.sql)",
              err
            );
          }
        });
    }

    subscribe();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, viewerId]);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    setError(false);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: viewerId, body: text })
      .select("id, sender_id, body, created_at")
      .single();

    if (insertError || !data) {
      setSending(false);
      setError(true);
      return;
    }

    await supabase.from("conversations").update({ last_message_at: data.created_at }).eq("id", conversationId);

    // The Realtime event for this same insert can arrive before this
    // request's own response does — dedupe the same way the live handler
    // does, instead of assuming this optimistic append is always first.
    setMessages((current) => (current.some((m) => m.id === data.id) ? current : [...current, data]));
    setBody("");
    setSending(false);
  }

  return (
    <div className="mt-8 flex flex-col">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-background-elevated">
          {otherAvatarUrl ? (
            <Image
              src={otherAvatarUrl}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
              style={{ objectPosition: otherAvatarPosition || "50% 50%" }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-accent">
              {otherName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </span>
        {otherHref ? (
          <Link href={otherHref} className="font-display font-semibold tracking-tight hover:text-accent">
            {otherName}
          </Link>
        ) : (
          <span className="font-display font-semibold tracking-tight">{otherName}</span>
        )}
      </div>

      <div className="flex flex-col gap-3 py-8">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-foreground-muted">{dict.empty}</p>
        ) : (
          messages.map((m) => {
            const own = m.sender_id === viewerId;
            return (
              <div
                key={m.id}
                className={`w-full rounded-2xl px-4 py-3 ${
                  own ? "bg-accent/10" : "border border-border bg-background-elevated"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-semibold tracking-tight ${own ? "text-accent" : "text-foreground"}`}>
                    {own ? dict.me : otherName}
                  </span>
                  <span className="shrink-0 text-xs text-foreground-muted">{formatMessageTime(m.created_at, locale)}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm">{m.body}</p>
              </div>
            );
          })
        )}
      </div>

      {canSend ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border pt-6">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={dict.placeholder}
            className="flex-1 rounded-full border border-border bg-background-elevated px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            aria-label={dict.send}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(to_right,var(--color-accent),var(--color-accent-2))] text-white transition-transform disabled:opacity-50 [@media(hover:hover)]:hover:not-disabled:scale-105"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <p className="border-t border-border pt-6 text-center text-sm text-foreground-muted">{dict.ineligible}</p>
      )}

      {error && <p className="mt-2 text-center text-sm text-red-500">{dict.errorGeneric}</p>}
    </div>
  );
}
