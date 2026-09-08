"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Zap,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
} from "lucide-react";

export default function TeacherSignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Interactive skills tag chip input state
  const [skills, setSkills] = useState<string[]>([
    "JavaScript",
    "React",
    "Python",
  ]);
  const [currentSkillInput, setCurrentSkillInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  // Field-specific error states
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddSkill = () => {
    const trimmed = currentSkillInput.trim().replace(/^,+|,+$/g, "");
    if (!trimmed) return;

    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillsError(`"${trimmed}" is already added.`);
      return;
    }

    setSkills([...skills, trimmed]);
    setCurrentSkillInput("");
    setSkillsError(null);
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);
    if (updated.length > 0 && skillsError) {
      setSkillsError(null);
    }
  };

  const validate = () => {
    let isValid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setSkillsError(null);
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

    if (skills.length === 0) {
      setSkillsError("Please add at least one skill you can teach.");
      isValid = false;
    }

    return isValid;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      // 1. Sign up via Supabase Auth with teacher metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: name.trim(),
            full_name: name.trim(),
            role: "teacher",
            skills: skills,
          },
        },
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

      // 2. Insert into profiles table with role = 'teacher' and skills array
      if (data?.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          username: name.trim(),
          full_name: name.trim(),
          role: "teacher",
          is_online: true,
          skills: skills,
        });

        if (profileError) {
          console.warn("Profile insertion note:", profileError.message);
        }
      }

      // 3. Handle session state
      if (data.session) {
        setSuccessMsg(
          "Teacher account registered successfully! Redirecting to teacher dashboard..."
        );
        setTimeout(() => {
          router.push("/teacher/dashboard");
        }, 1000);
      } else if (data.user && !data.session) {
        setSuccessMsg(
          "Account created! Please check your email inbox to confirm your account before logging in."
        );
        setTimeout(() => {
          router.push("/teacher/login");
        }, 3000);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during signup.";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50/60 via-slate-50/40 to-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-xl shadow-slate-200/50 transition-all">
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
            Join as a Teacher
          </h1>
          <p className="text-sm text-slate-500 max-w-sm">
            Turn your knowledge into income. Start teaching live, on-demand
            micro-sessions.
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

        {/* Form */}
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
              placeholder="Dr. Elena Vance"
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
              placeholder="elena@university.edu"
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

          {/* Skills Field with Interactive Tag Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Skills you teach{" "}
              <span className="font-normal text-slate-400">
                (type a skill and press Enter)
              </span>
            </label>

            {/* Render Tag Chips */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 text-xs font-medium text-indigo-700 shadow-2xs"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-indigo-400 hover:text-indigo-800 transition-colors cursor-pointer"
                      aria-label={`Remove skill ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Skill Input Row */}
            <div className="flex items-center gap-2">
              <input
                id="skillInput"
                type="text"
                value={currentSkillInput}
                onChange={(e) => {
                  setCurrentSkillInput(e.target.value);
                  if (skillsError) setSkillsError(null);
                }}
                onKeyDown={handleSkillKeyDown}
                placeholder="e.g. Next.js, Linear Algebra, Machine Learning..."
                disabled={isLoading}
                className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all focus:outline-none ${
                  skillsError
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                }`}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                disabled={!currentSkillInput.trim() || isLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
            {skillsError && (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{skillsError}</span>
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
                <span>Registering as Teacher...</span>
              </>
            ) : (
              <span>Create Teacher Account</span>
            )}
          </button>
        </form>

        {/* Switch Auth Page Link */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Already registered as an instructor?{" "}
            <Link
              href="/teacher/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 underline underline-offset-2 transition-colors"
            >
              Sign in
            </Link>
          </p>
          <p className="text-xs text-slate-400">
            Looking to learn instead?{" "}
            <Link
              href="/student/signup"
              className="text-slate-600 hover:text-indigo-600 underline underline-offset-2 transition-colors"
            >
              Sign up as Student
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
