"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useSessionRefresh(userId: string | undefined, role: "student" | "teacher") {
  const [revision, setRevision] = useState(0);
  const channelId = useId();
  const supabase = createClient();
  useEffect(() => {
    if (!userId) return;
    const refresh = () => setRevision(value => value + 1);
    const channel = supabase.channel(`booking-updates-${channelId}-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `${role}_id=eq.${userId}` }, refresh)
      .subscribe(status => { if (status === "SUBSCRIBED") refresh(); });
    window.addEventListener("focus", refresh);
    window.addEventListener("booking-changed", refresh);
    // A fallback catches missed realtime events after network interruptions.
    const timer = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 30000);
    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("booking-changed", refresh);
      clearInterval(timer);
    };
  }, [userId, role, supabase, channelId]);
  return revision;
}
