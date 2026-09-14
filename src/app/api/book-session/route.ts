import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to book a session." }, { status: 401 });
    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
    const { slotId, teacherId } = body ?? {};
    if (typeof slotId !== "string" || !UUID.test(slotId) || typeof teacherId !== "string" || !UUID.test(teacherId)) {
      return NextResponse.json({ error: "Choose a valid teacher and time slot." }, { status: 400 });
    }
    // Authorization, row locking, insertion and reservation all run in one DB transaction.
    const { data, error } = await supabase.rpc("book_available_slot", { p_slot_id: slotId, p_teacher_id: teacherId });
    if (error) {
      const status = ({ "42501": 403, "P0002": 404, "23505": 409, "22023": 400 } as Record<string, number>)[error.code] ?? 503;
      return NextResponse.json({ error: status === 503 ? "Booking is temporarily unavailable. Please try again." : error.message }, { status });
    }
    const session = data?.[0];
    if (!session) return NextResponse.json({ error: "Booking could not be confirmed." }, { status: 503 });
    return NextResponse.json({ success: true, sessionId: session.session_id,
      scheduledStartTime: session.scheduled_start_time, scheduledEndTime: session.scheduled_end_time }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Booking is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
