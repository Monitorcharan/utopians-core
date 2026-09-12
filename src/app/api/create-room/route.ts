import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CreateRoomRequestBody {
  teacherId?: string;
  studentId?: string;
  sessionId?: string;
}

/**
 * POST /api/create-room
 * Creates a native WebRTC session row in Supabase with status = 'pending', started_at = now().
 * Accepts: { teacherId, studentId, sessionId? }
 * Returns: { sessionId }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to request a session." }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "student") return NextResponse.json({ error: "Only student accounts can request sessions." }, { status: 403 });
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

    if (studentId !== user.id) return NextResponse.json({ error: "You can only request your own sessions." }, { status: 403 });
    const { data: teacher } = await supabase.from("profiles").select("role").eq("id", teacherId ?? "").single();
    if (teacher?.role !== "teacher") return NextResponse.json({ error: "Choose a valid teacher." }, { status: 400 });

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

    // 3. Create session row in Supabase
    const { data: sessionData, error: dbError } = await supabase
      .from("sessions")
      .insert({
        id: sessionId,
        student_id: studentId,
        teacher_id: teacherId,
        room_url: `/session/${sessionId}`, // Satisfies DB NOT NULL constraint while pointing to native WebRTC route
        status: "pending",
        started_at: new Date().toISOString(),
      })
      .select("id")
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

    // 4. Return { sessionId } (no room_url needed)
    return NextResponse.json(
      {
        sessionId: sessionData.id,
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
