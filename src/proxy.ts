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

  // Define which routes need protection
  const isStudentRoute = pathname.startsWith("/student/");
  const isTeacherRoute = pathname.startsWith("/teacher/");
  const isSessionRoute = pathname.startsWith("/session/");
  const isProtectedRoute = isStudentRoute || isTeacherRoute || isSessionRoute;

  const isStudentAuthPage =
    pathname === "/student/login" || pathname === "/student/signup";
  const isTeacherAuthPage =
    pathname === "/teacher/login" || pathname === "/teacher/signup";
  const isAuthPage = isStudentAuthPage || isTeacherAuthPage;

  // --- Unauthenticated users ---
  if (!user) {
    if (isProtectedRoute && !isAuthPage) {
      const loginPath = isTeacherRoute ? "/teacher/login" : "/student/login";
      const url = request.nextUrl.clone();
      url.pathname = loginPath;
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // --- Authenticated users: fetch their profile role ---
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role as "student" | "teacher" | undefined;

  // If no profile exists (shouldn't happen), log the user out and redirect to /
  if (!userRole) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("error", "no_profile");
    return NextResponse.redirect(url);
  }

  // If visiting their OWN role's auth pages, redirect to their dashboard
  if (userRole === "student" && isStudentAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/student/dashboard";
    return NextResponse.redirect(url);
  }

  if (userRole === "teacher" && isTeacherAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/teacher/dashboard";
    return NextResponse.redirect(url);
  }

  // If visiting the OTHER role's signup page, allow through so the page can show:
  // "You are logged in as a [role]. Please log out first to create a new account."
  if (pathname === "/teacher/signup" && userRole === "student") {
    return supabaseResponse;
  }

  if (pathname === "/student/signup" && userRole === "teacher") {
    return supabaseResponse;
  }

  // If visiting the OTHER role's login page, redirect to their dashboard
  if (pathname === "/teacher/login" && userRole === "student") {
    const url = request.nextUrl.clone();
    url.pathname = "/student/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname === "/student/login" && userRole === "teacher") {
    const url = request.nextUrl.clone();
    url.pathname = "/teacher/dashboard";
    return NextResponse.redirect(url);
  }

  // Role-based protected route enforcement (excluding auth pages)
  if (isStudentRoute && !isAuthPage && userRole === "teacher") {
    const url = request.nextUrl.clone();
    url.pathname = "/teacher/dashboard";
    return NextResponse.redirect(url);
  }

  if (isTeacherRoute && !isAuthPage && userRole === "student") {
    const url = request.nextUrl.clone();
    url.pathname = "/student/dashboard";
    return NextResponse.redirect(url);
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
