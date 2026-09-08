import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface CreateRoomRequestBody {
  teacherId?: string;
  studentId?: string;
  sessionId?: string;
}

/**
 * POST /api/create-room
 * Creates a Jitsi Meet private room and registers the pending session in Supabase.
 * Accepts: { teacherId, studentId, sessionId? }
 * Returns: { sessionId, roomUrl }
 */
export async function POST(request: Request) {
  try {
    // 1. Parse JSON payload
    let body: CreateRoomRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body" },
        { status: 400 }
      );
    }

    const { teacherId, studentId, sessionId: providedSessionId } = body;

    if (!teacherId || !studentId) {
      return NextResponse.json(
        {
          error: "Missing required parameters: both 'teacherId' and 'studentId' are required",
        },
        { status: 400 }
      );
    }

    // 2. Validate provided sessionId as UUID or generate a fresh one
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const sessionId =
      providedSessionId && uuidRegex.test(providedSessionId)
        ? providedSessionId
        : crypto.randomUUID();

    // 3. Construct Jitsi Meet room URL
    const roomUrl = `https://meet.jit.si/utopians-core-${sessionId}`;

    // 4. Create session row in Supabase
    const supabase = createAdminClient();

    const { data: sessionData, error: dbError } = await supabase
      .from("sessions")
      .upsert({
        id: sessionId,
        student_id: studentId,
        teacher_id: teacherId,
        room_url: roomUrl,
        status: "pending",
        started_at: new Date().toISOString(),
      })
      .select("id, room_url")
      .single();

    if (dbError || !sessionData) {
      console.error("Database error recording session in Supabase:", dbError);
      return NextResponse.json(
        {
          error: `Failed to register session in database: ${dbError?.message || "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    // 5. Return sessionId and roomUrl
    return NextResponse.json(
      {
        sessionId: sessionData.id,
        roomUrl: sessionData.room_url,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Unexpected error in /api/create-room:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected server error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
