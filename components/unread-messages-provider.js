"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUnreadMessageCount } from "@/lib/messaging";

const UnreadMessagesContext = createContext({ count: 0, refreshUnreadCount: () => {} });

export function useUnreadMessages() {
  return useContext(UnreadMessagesContext);
}

// Keeps the header's unread-message badge live. The initial count comes
// from the server (SiteHeader, computed once per full page load); after
// that, a Realtime subscription on new messages triggers a lightweight
// recount instead of polling on a timer — RLS on `messages` already
// restricts which INSERTs this client ever receives to the viewer's own
// conversations, so no extra filtering is needed here. `refreshUnreadCount`
// is also exposed so an open thread can resync the badge right after the
// server marks its messages read.
export function UnreadMessagesProvider({ viewerId, enabled, initialCount = 0, children }) {
  const [count, setCount] = useState(initialCount);
  const supabaseRef = useRef(null);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  async function refreshUnreadCount() {
    if (!viewerId) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();
    setCount(await getUnreadMessageCount(supabaseRef.current, viewerId));
  }

  useEffect(() => {
    if (!enabled || !viewerId) return;

    const supabase = createClient();
    supabaseRef.current = supabase;
    let channel;
    let cancelled = false;

    async function subscribe() {
      // Realtime evaluates RLS using whatever JWT the socket currently has —
      // if a channel subscribes before the session's access token has been
      // handed to the realtime connection, every event gets silently
      // dropped (RLS sees an anonymous connection). Setting it explicitly
      // here removes that race instead of hoping auth wiring finishes first.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`unread-messages-${viewerId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          if (payload.new.sender_id !== viewerId) refreshUnreadCount();
        })
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(
              "Unread-messages realtime subscription failed — is `messages` added to the supabase_realtime publication? (see supabase/add_messaging_realtime.sql)",
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
  }, [enabled, viewerId]);

  return (
    <UnreadMessagesContext.Provider value={{ count, refreshUnreadCount }}>{children}</UnreadMessagesContext.Provider>
  );
}
