import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types";

/**
 * Handles OAuth callback and exchanges auth code for session tokens.
 * Respects role parameter to initialize student or teacher profiles appropriately.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRole = searchParams.get("role");
  const role: UserRole = rawRole === "teacher" ? "teacher" : "student";
  const defaultNext = role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
  const next = searchParams.get("next") ?? defaultNext;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure profile exists for Google OAuth signup
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        const username =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          `${role}_${data.user.id.slice(0, 6)}`;

        await supabase.from("profiles").upsert({
          id: data.user.id,
          username,
          avatar_url: data.user.user_metadata?.avatar_url || null,
          role,
          is_online: true,
          skills: [],
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return user to login with error indicator if exchange fails
  return NextResponse.redirect(`${origin}/${role}/login?error=auth_callback_failed`);
}
