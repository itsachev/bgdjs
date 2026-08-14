"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const HEARTBEAT_MS = 60_000;

// Marks the current user as "online" for other visitors by touching
// last_seen_at while this tab is open. No realtime infra involved — DJ cards
// just treat a recent-enough last_seen_at as "online" when the page renders.
export function PresenceHeartbeat({ userId }) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const ping = () => {
      supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId).then();
    };

    ping();
    const interval = setInterval(ping, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [userId]);

  return null;
}
