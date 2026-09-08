import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types";

/**
 * Handles OAuth callback and exchanges auth code for session tokens.
 * Enforces role consistency: if a profile already exists, always redirect
 * based on the existing role regardless of what the signup page requested.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRole = searchParams.get("role");
  const requestedRole: UserRole = rawRole === "teacher" ? "teacher" : "student";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if a profile already exists for this user
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", data.user.id)
        .single();

      if (existingProfile) {
        // Profile exists — ALWAYS redirect based on existing role
        // This prevents role switching via OAuth
        const existingRole = existingProfile.role as UserRole;
        const dashboardPath =
          existingRole === "teacher" ? "/teacher/dashboard" : "/student/dashboard";

        // Update online status
        await supabase
          .from("profiles")
          .update({ is_online: true })
          .eq("id", data.user.id);

        return NextResponse.redirect(`${origin}${dashboardPath}`);
      }

      // No profile exists — create one with the requested role
      const username =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        data.user.email?.split("@")[0] ||
        `${requestedRole}_${data.user.id.slice(0, 6)}`;

      await supabase.from("profiles").upsert({
        id: data.user.id,
        username,
        avatar_url: data.user.user_metadata?.avatar_url || null,
        role: requestedRole,
        is_online: true,
        skills: [],
      });

      const defaultNext =
        requestedRole === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
      const next = searchParams.get("next") ?? defaultNext;

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return user to login with error indicator if exchange fails
  return NextResponse.redirect(
    `${origin}/${requestedRole}/login?error=auth_callback_failed`
  );
}
