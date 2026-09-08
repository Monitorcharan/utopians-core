"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/context/auth-context";
import {
  Zap,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  LogOut,
} from "lucide-react";

export default function StudentSignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, isAuthenticated, isLoading: isAuthLoading, signOut } =
    useAuthContext();

  // Redirect if already authenticated as student
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && profile?.role === "student") {
      router.replace("/student/dashboard");
    }
  }, [isAuthLoading, isAuthenticated, profile, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  // Field-specific error states
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [roleConflict, setRoleConflict] = useState<string | null>(null);

  const validate = () => {
    let isValid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    if (!name.trim()) {
      setNameError("Full name is required.");
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters.");
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError("Email address is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      isValid = false;
    }

    return isValid;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setRoleConflict(null);

    try {
      // 0. Check if email is already registered with a different role
      const checkRes = await fetch("/api/check-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists && checkData.role !== "student") {
          setRoleConflict(checkData.role);
          setIsLoading(false);
          return;
        }
        if (checkData.exists && checkData.role === "student") {
          // Already registered as student — prompt them to login instead
          setGeneralError("This email is already registered. Please sign in instead.");
          setIsLoading(false);
          return;
        }
      }

      // 1. Sign up via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: name.trim(),
            full_name: name.trim(),
            role: "student",
          },
        },
      });

      if (error) {
        // Handle "User already registered" from Supabase Auth
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already been registered")
        ) {
          // The user exists in auth — check their profile role
          const recheckRes = await fetch("/api/check-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim() }),
          });
          if (recheckRes.ok) {
            const recheckData = await recheckRes.json();
            if (recheckData.exists && recheckData.role !== "student") {
              setRoleConflict(recheckData.role);
              setIsLoading(false);
              return;
            }
          }
          setGeneralError("This email is already registered. Please sign in instead.");
          setIsLoading(false);
          return;
        }

        if (error.message.toLowerCase().includes("email")) {
          setEmailError(error.message);
        } else if (error.message.toLowerCase().includes("password")) {
          setPasswordError(error.message);
        } else {
          setGeneralError(error.message);
        }
        setIsLoading(false);
        return;
      }

      // 2. Insert row into profiles table with role = 'student'
      if (data?.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          username: name.trim(),
          full_name: name.trim(),
          role: "student",
          is_online: true,
          skills: [],
        });

        if (profileError) {
          console.warn("Profile insertion note:", profileError.message);
        }
      }

      // 3. Handle session state
      if (data.session) {
        setSuccessMsg("Account created successfully! Redirecting to student dashboard...");
        setTimeout(() => {
          router.push("/student/dashboard");
        }, 1000);
      } else if (data.user && !data.session) {
        setSuccessMsg(
          "Account created! Please check your email inbox to confirm your account before logging in."
        );
        setTimeout(() => {
          router.push("/student/login");
        }, 3000);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during signup.";
      setGeneralError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setIsOAuthLoading(true);
    setGeneralError(null);

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/student/dashboard`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setGeneralError(error.message);
        setIsOAuthLoading(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to initiate Google signup.";
      setGeneralError(message);
      setIsOAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50/60 via-slate-50/40 to-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-xl shadow-slate-200/50 transition-all">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="font-bold text-slate-900 text-xl tracking-tight">
              Utopians<span className="text-indigo-600">Core</span>
            </span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Create Student Account
          </h1>
          <p className="text-sm text-slate-500 max-w-xs">
            Join thousands of students learning live with on-demand expert tutors.
          </p>
        </div>

        {isAuthLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
            <span>Checking authentication...</span>
          </div>
        ) : isAuthenticated && profile && profile.role !== "student" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-amber-900">
                Already Logged In
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                You are logged in as a {profile.role}. Please log out first to create a new account.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={signOut}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-rose-500 transition-all shadow-xs cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
              <Link
                href={`/${profile.role}/dashboard`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-amber-800 hover:bg-amber-50 transition-all shadow-xs"
              >
                <span>Go to Teacher Dashboard</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleOAuth}
              disabled={isOAuthLoading || isLoading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isOAuthLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-mono text-[11px]">
                  or sign up with email
                </span>
              </div>
            </div>

            {/* Success Banner */}
            {successMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* General Error Banner */}
            {generalError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Role Conflict Banner */}
            {roleConflict && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                  <div className="space-y-2">
                    <p className="font-semibold text-amber-800">
                      This email is already registered as a {roleConflict}.
                    </p>
                    <p className="text-xs text-amber-700">
                      Each email can only be used for one role. Please log in with your existing account instead.
                    </p>
                    <Link
                      href={`/${roleConflict}/login`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 transition-colors"
                    >
                      Sign in as {roleConflict.charAt(0).toUpperCase() + roleConflict.slice(1)} →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Full Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="Alex Johnson"
                  disabled={isLoading}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all focus:outline-none ${
                    nameError
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  }`}
                />
                {nameError && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{nameError}</span>
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="alex@example.com"
                  disabled={isLoading}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all focus:outline-none ${
                    emailError
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  }`}
                />
                {emailError && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="At least 6 characters"
                    disabled={isLoading}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white pr-10 transition-all focus:outline-none ${
                      passwordError
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                        : "border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-500 hover:shadow-md transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Student Account</span>
                )}
              </button>
            </form>

            {/* Switch Auth Page Link */}
            <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-600">
                Already have an account?{" "}
                <Link
                  href="/student/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 underline underline-offset-2 transition-colors"
                >
                  Sign in
                </Link>
              </p>
              <p className="text-xs text-slate-400">
                Looking to teach instead?{" "}
                <Link
                  href="/teacher/signup"
                  className="text-slate-600 hover:text-indigo-600 underline underline-offset-2 transition-colors"
                >
                  Join as Teacher
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
