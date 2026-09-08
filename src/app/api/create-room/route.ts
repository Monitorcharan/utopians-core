import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CreateRoomRequestBody {
  teacherId?: string;
  studentId?: string;
}

interface DailyRoomResponse {
  id?: string;
  name: string;
  api_created?: boolean;
  privacy: string;
  url: string;
  created_at?: string;
  config?: Record<string, unknown>;
  error?: string;
  info?: string;
}

/**
 * POST /api/create-room
 * Creates a private video tutoring room via the Daily.co REST API
 * and registers a new pending session record in Supabase.
 */
export async function POST(request: Request) {
  try {
    // 1. Parse and validate JSON request body
    let body: CreateRoomRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body" },
        { status: 400 }
      );
    }

    const { teacherId, studentId } = body;

    if (!teacherId || !studentId) {
      return NextResponse.json(
        {
          error: "Missing required parameters: both 'teacherId' and 'studentId' are required",
        },
        { status: 400 }
      );
    }

    // 2. Retrieve and validate Daily.co API Key
    const dailyApiKey = process.env.DAILY_API_KEY;

    if (!dailyApiKey || dailyApiKey === "placeholder-daily-api-key") {
      return NextResponse.json(
        {
          error:
            "Daily.co API Key is not configured. Please set DAILY_API_KEY in your environment variables.",
        },
        { status: 500 }
      );
    }

    // 3. Call Daily.co REST API to create video room
    // Room expires in 2 hours (7200 seconds)
    const roomExp = Math.floor(Date.now() / 1000) + 7200;

    const dailyResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${dailyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        privacy: "public",
        properties: {
          exp: roomExp,
          enable_screenshare: true,
          enable_chat: true,
          eject_at_room_exp: true,
        },
      }),
    });

    if (!dailyResponse.ok) {
      const errorText = await dailyResponse.text();
      console.error("Daily.co room creation failed:", dailyResponse.status, errorText);

      let parsedMessage = errorText;
      try {
        const parsedError = JSON.parse(errorText);
        parsedMessage = parsedError.info || parsedError.error || errorText;
      } catch {
        // use raw errorText
      }

      return NextResponse.json(
        {
          error: `Failed to create video room via Daily.co API: ${parsedMessage}`,
        },
        { status: 500 }
      );
    }

    const dailyData = (await dailyResponse.json()) as DailyRoomResponse;

    if (!dailyData?.url) {
      return NextResponse.json(
        { error: "Daily.co API responded without a valid room URL" },
        { status: 500 }
      );
    }

    // 4. Store session details in Supabase sessions table
    const supabase = await createClient();

    const { data: sessionData, error: dbError } = await supabase
      .from("sessions")
      .insert({
        student_id: studentId,
        teacher_id: teacherId,
        room_url: dailyData.url,
        status: "pending",
        started_at: new Date().toISOString(),
      })
      .select("id, room_url")
      .single();

    if (dbError || !sessionData) {
      console.error("Database error recording session in Supabase:", dbError);
      return NextResponse.json(
        {
          error: `Room created at ${dailyData.url}, but failed to register session in database: ${dbError?.message}`,
        },
        { status: 500 }
      );
    }

    // 5. Return room URL and session ID in response
    return NextResponse.json(
      {
        roomUrl: dailyData.url,
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
