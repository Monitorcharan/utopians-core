"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Zap, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

function TeacherLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const urlError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  // Field-specific error states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(
    urlError === "auth_callback_failed"
      ? "Authentication callback failed. Please try again."
      : null
  );

  // Pre-check if already authenticated
  React.useEffect(() => {
    async function checkExistingSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role) {
          router.replace(
            profile.role === "teacher"
              ? "/teacher/dashboard"
              : "/student/dashboard"
          );
        } else {
          await supabase.auth.signOut();
        }
      }
    }
    checkExistingSession();
  }, [supabase, router]);

  const validate = () => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

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
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
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

      if (data?.user) {
        // Fetch profile to verify role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profileError || !profile?.role) {
          await supabase.auth.signOut();
          router.replace("/?error=profile_not_found");
          return;
        }

        await supabase
          .from("profiles")
          .update({ is_online: true })
          .eq("id", data.user.id);

        if (profile.role === "student") {
          router.replace("/student/dashboard");
          return;
        }

        router.replace("/teacher/dashboard");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
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
          redirectTo: `${origin}/auth/callback?next=/teacher/dashboard`,
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
        err instanceof Error ? err.message : "Failed to initiate Google sign in.";
      setGeneralError(message);
      setIsOAuthLoading(false);
    }
  };

  return (
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
          Welcome back, Teacher
        </h1>
        <p className="text-sm text-slate-500 max-w-xs">
          Sign in to your instructor portal to manage live availability and accept sessions.
        </p>
      </div>

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
            or continue with email
          </span>
        </div>
      </div>

      {/* General Error Banner */}
      {generalError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="teacher@example.com"
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
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="••••••••"
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
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In as Teacher</span>
          )}
        </button>
      </form>

      {/* Switch Auth Page Link */}
      <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-2">
        <p className="text-xs text-slate-600">
          Don&apos;t have an instructor account?{" "}
          <Link
            href="/teacher/signup"
            className="font-semibold text-indigo-600 hover:text-indigo-500 underline underline-offset-2 transition-colors"
          >
            Join as Teacher
          </Link>
        </p>
        <p className="text-xs text-slate-400">
          Looking for student portal?{" "}
          <Link
            href="/student/login"
            className="text-slate-600 hover:text-indigo-600 underline underline-offset-2 transition-colors"
          >
            Student Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function TeacherLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50/60 via-slate-50/40 to-white px-4 py-12 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8 text-slate-400 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mr-2" />
            Loading instructor portal...
          </div>
        }
      >
        <TeacherLoginForm />
      </Suspense>
    </div>
  );
}
