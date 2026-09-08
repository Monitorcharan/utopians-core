"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/context/auth-context";
import {
  Zap,
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";

function TeachersPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { user, profile, isAuthenticated, role, signOut, refreshProfile } = useAuthContext();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup form state
  const [signupFullName, setSignupFullName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupSkills, setSignupSkills] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Auto redirect if already teacher
  useEffect(() => {
    if (isAuthenticated && role === "teacher") {
      // Allow user to see welcome card or navigate to dashboard
    }
  }, [isAuthenticated, role]);

  // Handle Teacher Login
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }

    setLoginLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) {
        setLoginError(error.message);
        setLoginLoading(false);
        return;
      }

      if (data?.user) {
        // Fetch profile to verify role strictly
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profileError || !userProfile?.role) {
          await supabase.auth.signOut();
          setLoginError("Could not retrieve profile. Please contact support.");
          setLoginLoading(false);
          return;
        }

        // STRICT ROLE ENFORCEMENT: Students cannot log in here!
        if (userProfile.role === "student") {
          await supabase.auth.signOut();
          setLoginError(
            "Access Denied: This account is registered as a Student. Please use the Students Portal (/students) to sign in."
          );
          setLoginLoading(false);
          return;
        }

        // Valid teacher: mark online and go to dashboard
        await supabase
          .from("profiles")
          .update({ is_online: true })
          .eq("id", data.user.id);

        await refreshProfile();
        router.push("/teacher/dashboard");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setLoginError(msg);
      setLoginLoading(false);
    }
  };

  // Handle Teacher Signup
  const handleTeacherSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupFullName.trim() || !signupUsername.trim() || !signupEmail.trim() || !signupPassword) {
      setSignupError("All fields are required.");
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters long.");
      return;
    }

    setSignupLoading(true);

    try {
      const parsedSkills = signupSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          data: {
            full_name: signupFullName.trim(),
            username: signupUsername.trim().toLowerCase().replace(/\s+/g, "_"),
            role: "teacher",
            skills: parsedSkills,
          },
        },
      });

      if (error) {
        setSignupError(error.message);
        setSignupLoading(false);
        return;
      }

      if (data?.user) {
        // Ensure profile exists with role = teacher
        await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: signupFullName.trim(),
            username: signupUsername.trim().toLowerCase().replace(/\s+/g, "_"),
            role: "teacher",
            skills: parsedSkills,
            is_online: true,
          });

        await refreshProfile();
        router.push("/teacher/dashboard");
      } else {
        setSignupSuccess(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signup failed. Please try again.";
      setSignupError(msg);
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="font-semibold text-white text-lg tracking-tight">
              Utopians<span className="text-emerald-400">Core</span>
            </span>
            <span className="ml-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              Teachers Portal
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Main Site
            </Link>
            <Link
              href="/students"
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-xs"
            >
              Students Portal &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header text */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Teachers Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Sign in or register to set availability and receive live student requests.
            </p>
          </div>

          {/* Conflict Banner: If current user is logged in as a STUDENT */}
          {isAuthenticated && role === "student" && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-rose-300">
                    Student Account Active
                  </h3>
                  <p className="text-xs text-rose-300/80 leading-relaxed">
                    You are currently signed in with a <strong>Student</strong> account.
                    To use the Teachers Portal, please sign out of your student account first.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={signOut}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out Student</span>
                </button>
                <Link
                  href="/student/dashboard"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
                >
                  <span>Student Dashboard</span>
                </Link>
              </div>
            </div>
          )}

          {/* Active Teacher Banner: If user is ALREADY logged in as a TEACHER */}
          {isAuthenticated && role === "teacher" && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-base">
                  Welcome back, {profile?.full_name || profile?.username || "Instructor"}!
                </h3>
                <p className="text-xs text-slate-400">
                  You are signed into your teacher account.
                </p>
              </div>
              <div className="pt-2 space-y-2">
                <Link
                  href="/teacher/dashboard"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-all shadow-xs"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Go to Teacher Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Authentication Card (Shown when not authenticated) */}
          {!isAuthenticated && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-sm">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setLoginError(null);
                  }}
                  className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === "login"
                      ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-950/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Teacher Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("signup");
                    setSignupError(null);
                  }}
                  className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === "signup"
                      ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-950/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Apply as Teacher
                </button>
              </div>

              {/* Tab 1: Login */}
              {activeTab === "login" && (
                <form onSubmit={handleTeacherLogin} className="p-6 space-y-4">
                  {loginError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                      <span className="leading-relaxed">{loginError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Teacher Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="teacher@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all cursor-pointer shadow-xs shadow-emerald-500/20"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying Teacher Access...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In as Teacher</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-500 pt-2">
                    Are you a student?{" "}
                    <Link
                      href="/students"
                      className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2"
                    >
                      Use Students Portal
                    </Link>
                  </p>
                </form>
              )}

              {/* Tab 2: Signup */}
              {activeTab === "signup" && (
                <form onSubmit={handleTeacherSignup} className="p-6 space-y-4">
                  {signupError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                      <span className="leading-relaxed">{signupError}</span>
                    </div>
                  )}

                  {signupSuccess ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                      <h4 className="font-semibold text-sm text-emerald-300">
                        Check your email!
                      </h4>
                      <p className="text-xs text-emerald-400/80">
                        We sent a verification link to {signupEmail}. Please confirm to complete your registration.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Dr. Alex Smith"
                          value={signupFullName}
                          onChange={(e) => setSignupFullName(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Username
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="alexsmith"
                          value={signupUsername}
                          onChange={(e) => setSignupUsername(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="teacher@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Skills / Subjects (comma-separated)
                        </label>
                        <input
                          type="text"
                          placeholder="Python, React, Calculus, Physics"
                          value={signupSkills}
                          onChange={(e) => setSignupSkills(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Password (min 6 chars)
                        </label>
                        <div className="relative">
                          <input
                            type={showSignupPassword ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                          >
                            {showSignupPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={signupLoading}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all cursor-pointer shadow-xs shadow-emerald-500/20"
                      >
                        {signupLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Creating Teacher Profile...</span>
                          </>
                        ) : (
                          <>
                            <span>Register as Teacher</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </>
                  )}

                  <p className="text-center text-xs text-slate-500 pt-2">
                    Are you a student?{" "}
                    <Link
                      href="/students"
                      className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2"
                    >
                      Students Portal
                    </Link>
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Utopians Core &bull; Teachers Portal</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-300">
              Home
            </Link>
            <Link href="/for-teachers" className="hover:text-slate-300">
              Teacher Features
            </Link>
            <Link href="/students" className="hover:text-slate-300">
              Students Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function TeachersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      }
    >
      <TeachersPortalContent />
    </Suspense>
  );
}
