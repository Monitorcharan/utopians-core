import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

interface BookSessionRequestBody {
  slotId: string;
  teacherId: string;
}

/**
 * POST /api/book-session
 * Books a scheduled tutoring session from an existing availability slot.
 * Accepts: { slotId, teacherId }
 * Returns: { success: true, sessionId, scheduledStartTime, scheduledEndTime }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to book a session" },
        { status: 401 }
      );
    }

    let body: BookSessionRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { slotId, teacherId } = body;

    if (!slotId || !teacherId) {
      return NextResponse.json(
        { error: "Both 'slotId' and 'teacherId' are required to book a session" },
        { status: 400 }
      );
    }

    if (user.id === teacherId) {
      return NextResponse.json(
        { error: "Instructors cannot book sessions with themselves" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Verify availability slot exists and is unbooked
    const { data: slot, error: slotError } = await adminClient
      .from("availability_slots")
      .select("*")
      .eq("id", slotId)
      .eq("teacher_id", teacherId)
      .single();

    if (slotError || !slot) {
      console.error("Error fetching slot:", slotError);
      return NextResponse.json(
        { error: "The requested time slot was not found" },
        { status: 404 }
      );
    }

    if (slot.is_booked) {
      return NextResponse.json(
        { error: "This time slot has already been booked by another student" },
        { status: 409 }
      );
    }

    const slotStart = new Date(slot.start_time);
    if (slotStart < new Date()) {
      return NextResponse.json(
        { error: "Cannot book a time slot that has already passed" },
        { status: 400 }
      );
    }

    // 2. Create scheduled session row
    const sessionId = crypto.randomUUID();

    const { data: newSession, error: sessionError } = await adminClient
      .from("sessions")
      .insert({
        id: sessionId,
        student_id: user.id,
        teacher_id: teacherId,
        room_url: `/session/${sessionId}`,
        status: "scheduled",
        scheduled_start_time: slot.start_time,
        scheduled_end_time: slot.end_time,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError || !newSession) {
      console.error("Error creating scheduled session:", sessionError);
      return NextResponse.json(
        { error: `Failed to create session: ${sessionError?.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    // 3. Mark the slot as booked
    const { error: updateSlotError } = await adminClient
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", slotId);

    if (updateSlotError) {
      console.warn("Could not mark slot as booked:", updateSlotError);
    }

    // 4. Return success response
    return NextResponse.json(
      {
        success: true,
        sessionId: newSession.id,
        scheduledStartTime: newSession.scheduled_start_time,
        scheduledEndTime: newSession.scheduled_end_time,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Unexpected error in /api/book-session:", err);
    const message = err instanceof Error ? err.message : "Failed to book session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
