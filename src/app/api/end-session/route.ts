import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ReviewUpdate, ReviewInsert } from "@/types";

interface EndSessionRequestBody {
  sessionId?: string;
  studentRating?: number;
  teacherRating?: number;
  studentComment?: string;
  teacherComment?: string;
  review?: {
    studentRating?: number;
    studentComment?: string;
    teacherRating?: number;
    teacherComment?: string;
  };
}

/**
 * POST /api/end-session
 * Updates an active tutoring session in Supabase:
 * - Sets status = 'completed'
 * - Sets ended_at = now()
 * Accepts an optional review payload (flat or nested under review):
 * - { studentRating, teacherRating, studentComment, teacherComment }
 * - Inserts or updates the corresponding row in the `reviews` table.
 */
export async function POST(request: Request) {
  try {
    // 1. Parse and validate JSON request body
    let body: EndSessionRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body" },
        { status: 400 }
      );
    }

    const sessionId = body.sessionId;
    const studentRating = body.studentRating ?? body.review?.studentRating;
    const teacherRating = body.teacherRating ?? body.review?.teacherRating;
    const studentComment = body.studentComment ?? body.review?.studentComment;
    const teacherComment = body.teacherComment ?? body.review?.teacherComment;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid required parameter: 'sessionId'" },
        { status: 400 }
      );
    }

    // Validate rating ranges if provided
    if (
      studentRating !== undefined &&
      (typeof studentRating !== "number" ||
        studentRating < 1 ||
        studentRating > 5)
    ) {
      return NextResponse.json(
        { error: "studentRating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    if (
      teacherRating !== undefined &&
      (typeof teacherRating !== "number" ||
        teacherRating < 1 ||
        teacherRating > 5)
    ) {
      return NextResponse.json(
        { error: "teacherRating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    const hasReviewData =
      studentRating !== undefined ||
      teacherRating !== undefined ||
      Boolean(studentComment?.trim()) ||
      Boolean(teacherComment?.trim());

    const supabase = createAdminClient();

    // 2. Fetch existing session to verify existence and current status
    const { data: existingSession, error: fetchError } = await supabase
      .from("sessions")
      .select("id, status, ended_at, student_id, teacher_id")
      .eq("id", sessionId)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: `Session not found with id: ${sessionId}` },
        { status: 404 }
      );
    }

    // 3. Handle session completion state
    let updatedSession = existingSession;

    if (existingSession.status === "cancelled") {
      return NextResponse.json(
        {
          error:
            "Session has already been cancelled and cannot be marked as completed",
        },
        { status: 400 }
      );
    }

    if (existingSession.status !== "completed") {
      const nowIso = new Date().toISOString();
      const { data: updated, error: updateError } = await supabase
        .from("sessions")
        .update({
          status: "completed",
          ended_at: nowIso,
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (updateError || !updated) {
        console.error("Database error ending session:", updateError);
        return NextResponse.json(
          {
            error: `Failed to update session: ${
              updateError?.message || "Unknown database error"
            }`,
          },
          { status: 500 }
        );
      }
      updatedSession = updated;
    } else if (!hasReviewData) {
      // Session was already completed and no review data provided
      return NextResponse.json(
        {
          error: "Session has already been completed",
          ended_at: existingSession.ended_at,
        },
        { status: 400 }
      );
    }

    // 4. Handle review insertion/update if review payload is provided
    let reviewRecord = null;
    if (hasReviewData) {
      try {
        const { data: existingReview } = await supabase
          .from("reviews")
          .select("*")
          .eq("session_id", sessionId)
          .maybeSingle();

        if (existingReview) {
          // Update existing review fields
          const updateData: ReviewUpdate = {};
          if (studentRating !== undefined)
            updateData.student_rating = Math.round(studentRating);
          if (teacherRating !== undefined)
            updateData.teacher_rating = Math.round(teacherRating);
          if (studentComment !== undefined)
            updateData.student_comment = studentComment.trim() || null;
          if (teacherComment !== undefined)
            updateData.teacher_comment = teacherComment.trim() || null;

          const { data: updatedRev, error: revUpdateErr } = await supabase
            .from("reviews")
            .update(updateData)
            .eq("id", existingReview.id)
            .select()
            .single();

          if (revUpdateErr) {
            console.error("Error updating review:", revUpdateErr);
          } else {
            reviewRecord = updatedRev;
          }
        } else {
          // Insert new review row
          const insertData: ReviewInsert = {
            session_id: existingSession.id,
            student_id: existingSession.student_id,
            teacher_id: existingSession.teacher_id,
            student_rating:
              studentRating !== undefined
                ? Math.round(studentRating)
                : null,
            teacher_rating:
              teacherRating !== undefined
                ? Math.round(teacherRating)
                : null,
            student_comment: studentComment?.trim() || null,
            teacher_comment: teacherComment?.trim() || null,
          };

          const { data: insertedRev, error: revInsertErr } = await supabase
            .from("reviews")
            .insert(insertData)
            .select()
            .single();

          if (revInsertErr) {
            console.error("Error inserting review:", revInsertErr);
          } else {
            reviewRecord = insertedRev;
          }
        }
      } catch (revError) {
        console.warn("Reviews table operation failed or not created yet:", revError);
      }
    }

    // 5. Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Session ended successfully",
        session: updatedSession,
        review: reviewRecord,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Unexpected error in /api/end-session:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected server error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
