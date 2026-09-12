import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** The single email/password entry point for both role-specific forms. */
export async function POST(request: Request) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Please submit a valid form." }, { status: 400 }); }

  const { action, role, email, password, name, username, skills } = body ?? {};
  if ((action !== "login" && action !== "signup") || (role !== "student" && role !== "teacher")) {
    return NextResponse.json({ error: "Choose a valid portal and try again." }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== "string" || !password || password.length > 128) {
    return NextResponse.json({ error: "Enter a valid email address and password." }, { status: 400 });
  }
  if (action === "signup" && (typeof name !== "string" || !name.trim() || name.trim().length > 100 || typeof username !== "string" || !/^[a-zA-Z0-9_]{3,30}$/.test(username) || password.length < 8)) {
    return NextResponse.json({ error: "Enter your name, a username of 3–30 letters, numbers or underscores, and a password of at least 8 characters." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    let user;
    if (action === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: {
          emailRedirectTo: `${new URL(request.url).origin}/auth/callback?role=${role}`,
          data: {
            role, full_name: name.trim(), username: username.toLowerCase(),
            skills: role === "teacher" && typeof skills === "string" ? skills.split(",").map(value => value.trim()).filter(Boolean).slice(0, 20) : [],
          },
        },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      if (!data.session) return NextResponse.json({ confirmationRequired: true });
      user = data.user;
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return NextResponse.json({ error: error.code === "email_not_confirmed" ? "Confirm your email before signing in." : "The email or password is incorrect. Please try again." }, { status: 401 });
      user = data.user;
    }

    if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profileError || !profile) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Your account profile could not be loaded. Please try again or contact support." }, { status: 503 });
    }
    if (profile.role !== role) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: `This account cannot access the ${role} portal. Use an account registered here.` }, { status: 403 });
    }
    return NextResponse.json({ destination: `/${role}/dashboard` });
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
