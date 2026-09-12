import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/availability
 * Fetch availability slots:
 * - Query param ?teacherId=<uuid> -> fetch future unbooked slots for public teacher profile
 * - Without query param -> fetch all slots for the currently authenticated teacher
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");
    const supabase = await createClient();

    if (teacherId) {
      // Public query for student booking on /teacher/[id]
      const nowIso = new Date().toISOString();
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from("availability_slots")
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("is_booked", false)
        .gte("start_time", nowIso)
        .order("start_time", { ascending: true });

      if (error) {
        // Table might not be migrated yet or empty
        console.warn("Could not query availability_slots:", error.message);
        return NextResponse.json({ slots: [] }, { status: 200 });
      }

      return NextResponse.json({ slots: data || [] }, { status: 200 });
    }

    // Authenticated query for teacher's own management dashboard
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "teacher") return NextResponse.json({ error: "A teacher account is required." }, { status: 403 });
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("availability_slots")
      .select("*")
      .eq("teacher_id", user.id)
      .order("start_time", { ascending: true });

    if (error) {
      console.warn("Could not query teacher slots:", error.message);
      return NextResponse.json({ slots: [] }, { status: 200 });
    }

    return NextResponse.json({ slots: data || [] }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/availability error:", err);
    return NextResponse.json({ slots: [] }, { status: 200 });
  }
}

/**
 * POST /api/availability
 * Add a new availability slot for the authenticated teacher:
 * Accepts: { startTime, endTime }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { startTime, endTime } = body;

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required parameters: 'startTime' and 'endTime' are required" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format provided for startTime or endTime" },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    if (start < now) {
      return NextResponse.json(
        { error: "Start time cannot be in the past" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "teacher") return NextResponse.json({ error: "A teacher account is required." }, { status: 403 });
    const adminClient = createAdminClient();

    // Check for overlapping slots for this teacher
    const { data: existingSlots, error: checkError } = await adminClient
      .from("availability_slots")
      .select("id, start_time, end_time")
      .eq("teacher_id", user.id);

    if (checkError) {
      console.warn("Error checking existing slots:", checkError);
    } else if (existingSlots) {
      const hasOverlap = existingSlots.some((slot) => {
        const slotStart = new Date(slot.start_time);
        const slotEnd = new Date(slot.end_time);
        // Overlap occurs when start < slotEnd AND end > slotStart
        return start < slotEnd && end > slotStart;
      });

      if (hasOverlap) {
        return NextResponse.json(
          { error: "This slot overlaps with one of your existing availability slots" },
          { status: 400 }
        );
      }
    }

    // Insert new slot
    const { data: newSlot, error: insertError } = await adminClient
      .from("availability_slots")
      .insert({
        teacher_id: user.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        is_booked: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert availability slot error:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create slot" },
        { status: 500 }
      );
    }

    return NextResponse.json({ slot: newSlot }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/availability error:", err);
    const message = err instanceof Error ? err.message : "Failed to create availability slot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/availability
 * Delete an availability slot:
 * Accepts: { slotId }
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let slotId = searchParams.get("slotId");

    if (!slotId) {
      try {
        const body = await request.json();
        slotId = body.slotId;
      } catch {
        // No body
      }
    }

    if (!slotId) {
      return NextResponse.json(
        { error: "Missing required parameter 'slotId'" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "teacher") return NextResponse.json({ error: "A teacher account is required." }, { status: 403 });
    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient
      .from("availability_slots")
      .delete()
      .eq("id", slotId)
      .eq("teacher_id", user.id);

    if (deleteError) {
      console.error("Delete slot error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete slot" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("DELETE /api/availability error:", err);
    const message = err instanceof Error ? err.message : "Failed to delete availability slot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
