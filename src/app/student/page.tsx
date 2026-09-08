"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  BookOpen,
  Video,
  Star,
  ShieldAlert,
} from "lucide-react";
import { useAuthContext } from "@/context/auth-context";

export default function StudentPortalPage() {
  const { role, isAuthenticated, isLoading, profile, signOut } =
    useAuthContext();

  // Student logged in: show dashboard shortcut
  const isStudentLoggedIn = isAuthenticated && role === "student";
  // Teacher logged in: show wrong portal warning
  const isTeacherLoggedIn = isAuthenticated && role === "teacher";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 text-white font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-40 w-full border-b border-indigo-800/60 bg-indigo-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo → shared landing */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white border border-white/10 group-hover:bg-white/20 transition-all">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className="font-semibold text-white/90 text-base tracking-tight">
              Utopians<span className="text-indigo-300">Core</span>
            </span>
          </Link>

          {/* Portal label */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-indigo-700/60 bg-indigo-800/40 px-3 py-1 text-xs font-semibold text-indigo-300">
            <GraduationCap className="h-3.5 w-3.5" />
            Student Portal
          </div>

          {/* Auth actions */}
          <div className="flex items-center gap-2">
            {!isLoading && isStudentLoggedIn && (
              <>
                <Link
                  href="/student/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400 transition-all"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-rose-300 hover:border-rose-400/40 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            )}
            {!isLoading && !isAuthenticated && (
              <Link
                href="/student/login"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:border-white/30 transition-all"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Wrong portal warning (teacher visiting student portal) */}
        {!isLoading && isTeacherLoggedIn && (
          <div className="w-full max-w-md mb-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-amber-200">Wrong Portal</h2>
              <p className="text-sm text-amber-300/80">
                You&apos;re logged in as a <strong>teacher</strong>. This is the
                student portal. Log out to access the student portal with a
                student account.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={signOut}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-400 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
              <Link
                href="/teacher/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-400/20 transition-all"
              >
                Go to Teacher Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="text-center space-y-4 max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-600/50 bg-indigo-800/40 px-4 py-1.5 text-xs font-semibold text-indigo-300">
            <GraduationCap className="h-3.5 w-3.5" />
            Student Portal
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Learn anything.{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              Instantly.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-indigo-200/70 max-w-xl mx-auto leading-relaxed">
            Connect with expert teachers for live, on-demand micro-sessions. Get
            help exactly when you need it — no courses, no waiting.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12">
          {[
            { icon: Video, label: "HD Live Video Calls" },
            { icon: Star, label: "Verified Expert Teachers" },
            { icon: BookOpen, label: "Any Subject, Any Level" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-indigo-700/50 bg-indigo-800/30 px-3.5 py-1.5 text-xs font-medium text-indigo-300"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
          ))}
        </div>

        {/* CTA Card */}
        {isLoading ? (
          <div className="w-full max-w-sm rounded-2xl border border-indigo-700/40 bg-indigo-800/30 p-8 text-center text-indigo-400 text-sm animate-pulse">
            Loading...
          </div>
        ) : isStudentLoggedIn ? (
          // Already logged in as student
          <div className="w-full max-w-sm rounded-2xl border border-indigo-600/40 bg-indigo-800/30 backdrop-blur-sm p-8 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-indigo-300/70 mb-1">Welcome back,</p>
              <h2 className="text-xl font-bold text-white">
                {profile?.full_name || profile?.username || "Student"}
              </h2>
            </div>
            <Link
              href="/student/dashboard"
              className="block w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-900/50"
            >
              Go to Your Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex gap-2 text-xs text-indigo-400/60 items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Logged in as student
            </div>
          </div>
        ) : (
          // Not logged in — show signup/login options
          <div className="w-full max-w-sm rounded-2xl border border-indigo-700/40 bg-indigo-800/30 backdrop-blur-sm p-8 space-y-4">
            <h2 className="text-center text-lg font-bold text-white mb-2">
              Get started
            </h2>
            <Link
              href="/student/signup"
              className="block w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-900/50"
            >
              <UserPlus className="h-4 w-4" />
              Create Student Account
            </Link>
            <Link
              href="/student/login"
              className="block w-full inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-600/50 bg-indigo-800/40 px-6 py-3.5 text-sm font-semibold text-white/80 hover:bg-indigo-700/60 hover:border-indigo-500/60 transition-all"
            >
              <LogIn className="h-4 w-4" />
              Sign In to Student Account
            </Link>

            <div className="pt-3 border-t border-indigo-700/40 text-center">
              <p className="text-xs text-indigo-400/60">
                Are you a teacher?{" "}
                <Link
                  href="/teacher"
                  className="text-indigo-300 hover:text-indigo-200 font-medium underline underline-offset-2"
                >
                  Go to Teacher Portal →
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-indigo-800/40 py-6 text-center text-xs text-indigo-500/60">
        <Link href="/" className="hover:text-indigo-400 transition-colors">
          ← Back to UtopiansCo{" "}
        </Link>
        {" · "}
        <Link href="/teacher" className="hover:text-indigo-400 transition-colors">
          Teacher Portal
        </Link>
      </footer>
    </div>
  );
}
