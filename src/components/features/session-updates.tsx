"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuthContext } from "@/context/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useSessionRefresh } from "@/hooks/use-session-refresh";
import type { Database } from "@/types/database";

export function SessionUpdates({ role }: { role: "student" | "teacher" }) {
  const { user } = useAuthContext();
  const revision = useSessionRefresh(user?.id, role);
  const supabase = createClient();
  const [changes, setChanges] = useState<Database["public"]["Tables"]["session_changes"]["Row"][]>([]);
  useEffect(() => {
    let active = true;
    if (!user) return;
    void supabase.from("session_changes").select("*").order("created_at", { ascending: false }).limit(3)
      .then(({ data }) => { if (active && data) setChanges(data); });
    return () => { active = false; };
  }, [supabase, user, revision]);
  if (!changes.length) return null;
  return <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5" aria-label="Recent booking updates">
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Bell size={16} />Booking updates</div>
    <ul className="space-y-3" aria-live="polite" aria-relevant="additions">
      {changes.map(change => <li key={change.id} className="text-xs leading-6 text-slate-600">
        <span className="font-semibold text-slate-800">{change.actor_id === user?.id ? "You" : role === "teacher" ? "Your student" : "Your teacher"}</span>
        {change.kind === "cancelled" ? " cancelled the session on " : " moved the session from "}
        {new Date(change.previous_start_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        {change.new_start_time && <> to <strong>{new Date(change.new_start_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</strong></>}.
      </li>)}
    </ul>
    <Link href={`/${role}/history`} className="mt-3 inline-block text-xs font-semibold text-indigo-600">View session history</Link>
  </section>;
}
