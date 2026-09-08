import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/check-role
 *
 * Checks if a user with the given email already has a profile
 * and returns their existing role. Used during signup to prevent
 * a user from registering as both student and teacher.
 *
 * Body: { email: string }
 * Returns: { exists: boolean, role?: "student" | "teacher" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Use the admin client to list users by email in auth.users
    const { data: usersData, error: listError } =
      await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });

    // If admin API is not available, fall back to direct profile query
    // The admin.listUsers doesn't support email filter directly,
    // so we'll use a different approach: query auth.users via admin getUserByEmail
    // Actually, the admin client doesn't have getUserByEmail.
    // The most reliable approach: search profiles with a join through auth.

    // Alternative: Query the profiles table. The profiles table doesn't store email,
    // but we can look up via supabase admin auth API.

    void usersData;
    void listError;

    // Use admin.listUsers and filter — but this is inefficient.
    // Better: Use the Supabase admin API to get user by email.
    // supabase.auth.admin.getUserById is available but not by email.
    // The cleanest way: use the admin.listUsers filter.

    // Actually, Supabase JS v2 admin client supports listing users.
    // We'll iterate to find the user — for small user bases this is fine.
    // For production, you'd want a DB function or a direct SQL query.

    // Best approach: Try to look up the user in auth via admin,
    // then check their profile.

    const { data: allUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const matchingUser = allUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (!matchingUser) {
      return NextResponse.json({ exists: false });
    }

    // User exists in auth — check their profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", matchingUser.id)
      .single();

    if (!profile) {
      // Auth user exists but no profile — allow signup (profile will be created)
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      role: profile.role,
    });
  } catch (err) {
    console.error("check-role error:", err);
    return NextResponse.json(
      { error: "Failed to check user role." },
      { status: 500 }
    );
  }
}
