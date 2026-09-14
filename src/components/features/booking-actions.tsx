"use client";

import { useId, useRef, useState } from "react";
import { CalendarDays, Loader2, X } from "lucide-react";
import type { AvailabilitySlot } from "@/types/database";

export function BookingActions({ sessionId, teacherId, startTime, role, canChange }: {
  sessionId: string; teacherId?: string; startTime: string; role: "student" | "teacher"; canChange: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [action, setAction] = useState<"cancel" | "reschedule">("cancel");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [expected, setExpected] = useState(startTime);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function open(nextAction: "cancel" | "reschedule") {
    setExpected(startTime);
    setAction(nextAction); setError(""); setSelected(""); setSlots([]); setNotice("");
    dialog.current?.showModal();
    if (nextAction !== "reschedule") return;
    setLoading(true);
    try {
      const response = await fetch(`/api/availability?teacherId=${encodeURIComponent(teacherId || "")}`, { signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load availability.");
      setSlots((result.slots || []).filter((slot: AvailabilitySlot) => Date.parse(slot.start_time) > Date.now() + 300000));
    } catch { setError("Could not load available times. Close this window and try again."); }
    finally { setLoading(false); }
  }
  async function confirm() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/session-booking", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action, expectedStartTime: expected, slotId: selected || undefined }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not change your booking.");
      dialog.current?.close();
      setNotice(action === "cancel" ? "Session cancelled." : "Your new time is confirmed.");
      window.dispatchEvent(new Event("booking-changed"));
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "The request timed out. Close this window to refresh the booking before trying again.");
    } finally { setBusy(false); }
  }
  function close() {
    if (busy) return;
    dialog.current?.close();
    window.dispatchEvent(new Event("booking-changed"));
  }
  return <div className="mt-3">
    {canChange ? <div className="flex flex-wrap items-center gap-3 text-xs">
      {role === "student" && <button onClick={() => void open("reschedule")} className="flex items-center gap-1.5 rounded-md px-2 py-2 font-semibold text-indigo-600 hover:bg-indigo-50"><CalendarDays size={14} />Reschedule</button>}
      <button onClick={() => void open("cancel")} className="rounded-md px-2 py-2 text-rose-600 hover:bg-rose-50">Cancel session</button>
    </div> : <p className="text-[11px] text-slate-500">Changes close 5 minutes before the start.</p>}
    {notice && <p role="status" className="mt-2 text-xs text-emerald-700">{notice}</p>}
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={event => { if (busy) event.preventDefault(); else window.dispatchEvent(new Event("booking-changed")); }} className="m-auto w-[calc(100%-32px)] max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-950/40">
      <div className="flex items-center justify-between gap-4"><h2 id={titleId} className="text-lg font-semibold">{action === "cancel" ? "Cancel this session?" : "Choose a new time"}</h2><button aria-label="Close" disabled={busy} onClick={close} className="rounded-md p-2"><X size={18} /></button></div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{action === "cancel" ? "The session will stay in your history, and the other participant will see the cancellation in their dashboard." : "Choose another slot with the same teacher. Your original booking stays in place until the new time is confirmed."}</p>
      <p className="mt-3 text-xs text-slate-500">Current time: {new Date(expected).toLocaleString()}</p>
      {action === "reschedule" && <div className="mt-5">
        {loading ? <p role="status" className="flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin" />Finding available times...</p> : slots.length ? <label className="grid gap-2 text-sm font-medium">New session time
          <select value={selected} onChange={event => setSelected(event.target.value)} disabled={busy} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm">
            <option value="">Select a time</option>
            {slots.map(slot => <option key={slot.id} value={slot.id}>{new Date(slot.start_time).toLocaleString()} – {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</option>)}
          </select><span className="text-xs font-normal text-slate-500">Times are shown in your local timezone.</span>
        </label> : !error && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No alternative times are available. Your current booking is unchanged.</p>}
      </div>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3"><button disabled={busy} onClick={close} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm">Keep current booking</button><button onClick={() => void confirm()} disabled={busy || loading || (action === "reschedule" && !selected)} className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${action === "cancel" ? "bg-rose-600" : "bg-indigo-600"}`}>{busy ? "Saving..." : action === "cancel" ? "Confirm cancellation" : "Confirm new time"}</button></div>
    </dialog>
  </div>;
}
