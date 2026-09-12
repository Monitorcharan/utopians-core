import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy handler.
 *
 * 1. Refreshes Supabase auth session cookies.
 * 2. Protects /student/* and /teacher/* routes:
 *    - Unauthenticated users → redirected to the appropriate login page.
 *    - Wrong-role users → redirected to the correct dashboard.
 * 3. Auth pages (/student/login, /student/signup, etc.)
 *    → redirect authenticated users to their dashboard.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: always call getUser() to refresh the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const studentAuth = pathname === "/student/login" || pathname === "/student/signup";
  const teacherAuth = pathname === "/teacher/login" || pathname === "/teacher/signup";
  const authPage = studentAuth || teacherAuth;
  const studentArea = pathname.startsWith("/student/");
  const teacherArea = pathname.startsWith("/teacher/");
  const sessionArea = pathname.startsWith("/session/");

  function redirectTo(path: string) {
    const url = request.nextUrl.clone();
    const destination = new URL(path, request.url);
    url.pathname = destination.pathname;
    url.search = destination.search;
    const response = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie);
    return response;
  }

  if (!user) {
    if ((studentArea || teacherArea || sessionArea) && !authPage) {
      return redirectTo(teacherArea ? "/teacher/login" : "/student/login");
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role;
  if (role !== "student" && role !== "teacher") {
    await supabase.auth.signOut();
    // Auth and callback pages can present their own errors without a redirect loop.
    return authPage || pathname === "/auth/callback" ? supabaseResponse : redirectTo(`${teacherArea ? "/teacher/login" : "/student/login"}?error=profile_unavailable`);
  }

  if ((studentAuth && role === "student") || (teacherAuth && role === "teacher")) {
    return redirectTo(`/${role}/dashboard`);
  }
  // A different active account is never displayed in the selected portal.
  // The auth screen offers sign out without exposing its profile or role.
  if (authPage) return supabaseResponse;

  if (((studentArea && role !== "student") || (teacherArea && role !== "teacher"))) {
    return redirectTo(`/${role}/dashboard`);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata)
     * - Public assets (svg, png, jpg, etc.)
     * - API routes (handled by their own route handlers)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)",
  ],
};
