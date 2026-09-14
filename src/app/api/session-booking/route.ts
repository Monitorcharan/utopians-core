import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to manage your booking." }, { status: 401 });
    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
    const { sessionId, action, expectedStartTime, slotId } = body ?? {};
    if (typeof sessionId !== "string" || !UUID.test(sessionId) || !["cancel", "reschedule"].includes(action)
      || typeof expectedStartTime !== "string" || !Number.isFinite(Date.parse(expectedStartTime))
      || (action === "reschedule" && (typeof slotId !== "string" || !UUID.test(slotId)))) {
      return NextResponse.json({ error: "Choose a valid booking and time." }, { status: 400 });
    }
    const { data, error } = await supabase.rpc("change_scheduled_session", {
      p_session_id: sessionId, p_action: action, p_expected_start_time: expectedStartTime,
      p_slot_id: action === "reschedule" ? slotId : undefined,
    });
    if (error) {
      const status = ({ "42501": 403, "P0002": 404, "23505": 409, "22023": 400 } as Record<string, number>)[error.code] ?? 503;
      return NextResponse.json({ error: status === 503 ? "Could not change your booking. Please try again." : error.message }, { status });
    }
    return NextResponse.json({ sessionId: data, success: true });
  } catch {
    return NextResponse.json({ error: "Could not change your booking. Please try again." }, { status: 503 });
  }
}
