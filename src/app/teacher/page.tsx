"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  DollarSign,
  Calendar,
  Users,
  ShieldAlert,
} from "lucide-react";
import { useAuthContext } from "@/context/auth-context";

export default function TeacherPortalPage() {
  const { role, isAuthenticated, isLoading, profile, signOut } =
    useAuthContext();

  const isTeacherLoggedIn = isAuthenticated && role === "teacher";
  const isStudentLoggedIn = isAuthenticated && role === "student";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-40 w-full border-b border-emerald-900/50 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white border border-white/10 group-hover:bg-white/20 transition-all">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className="font-semibold text-white/90 text-base tracking-tight">
              Utopians<span className="text-emerald-400">Core</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-400">
            <BookOpen className="h-3.5 w-3.5" />
            Teacher Portal
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && isTeacherLoggedIn && (
              <>
                <Link
                  href="/teacher/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-all"
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
                href="/teacher/login"
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
        {/* Wrong portal warning (student visiting teacher portal) */}
        {!isLoading && isStudentLoggedIn && (
          <div className="w-full max-w-md mb-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-amber-200">Wrong Portal</h2>
              <p className="text-sm text-amber-300/80">
                You&apos;re logged in as a <strong>student</strong>. This is the
                teacher portal. Log out to access this portal with a teacher
                account.
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
                href="/student/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-400/20 transition-all"
              >
                Go to Student Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="text-center space-y-4 max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/50 bg-emerald-900/30 px-4 py-1.5 text-xs font-semibold text-emerald-400">
            <BookOpen className="h-3.5 w-3.5" />
            Teacher Portal
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Teach on demand.{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Earn freely.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-emerald-200/60 max-w-xl mx-auto leading-relaxed">
            Share your expertise in live micro-sessions. You choose when to
            teach, who to teach, and what to charge.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12">
          {[
            { icon: DollarSign, label: "Set Your Own Rates" },
            { icon: Calendar, label: "Flexible Schedule" },
            { icon: Users, label: "Instant Student Matching" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-emerald-800/50 bg-emerald-900/20 px-3.5 py-1.5 text-xs font-medium text-emerald-400"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
          ))}
        </div>

        {/* CTA Card */}
        {isLoading ? (
          <div className="w-full max-w-sm rounded-2xl border border-emerald-800/40 bg-emerald-900/20 p-8 text-center text-emerald-500 text-sm animate-pulse">
            Loading...
          </div>
        ) : isTeacherLoggedIn ? (
          <div className="w-full max-w-sm rounded-2xl border border-emerald-700/40 bg-emerald-900/20 backdrop-blur-sm p-8 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-emerald-400/60 mb-1">Welcome back,</p>
              <h2 className="text-xl font-bold text-white">
                {profile?.full_name || profile?.username || "Teacher"}
              </h2>
            </div>
            <Link
              href="/teacher/dashboard"
              className="block w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/50"
            >
              Go to Your Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex gap-2 text-xs text-emerald-500/50 items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Logged in as teacher
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm rounded-2xl border border-emerald-800/40 bg-emerald-900/20 backdrop-blur-sm p-8 space-y-4">
            <h2 className="text-center text-lg font-bold text-white mb-2">
              Get started
            </h2>
            <Link
              href="/teacher/signup"
              className="block w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/50"
            >
              <UserPlus className="h-4 w-4" />
              Create Teacher Account
            </Link>
            <Link
              href="/teacher/login"
              className="block w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700/50 bg-emerald-900/30 px-6 py-3.5 text-sm font-semibold text-white/80 hover:bg-emerald-800/50 hover:border-emerald-600/50 transition-all"
            >
              <LogIn className="h-4 w-4" />
              Sign In to Teacher Account
            </Link>

            <div className="pt-3 border-t border-emerald-800/40 text-center">
              <p className="text-xs text-emerald-500/50">
                Are you a student?{" "}
                <Link
                  href="/student"
                  className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2"
                >
                  Go to Student Portal →
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-emerald-900/40 py-6 text-center text-xs text-emerald-600/50">
        <Link href="/" className="hover:text-emerald-500 transition-colors">
          ← Back to UtopiansCo{" "}
        </Link>
        {" · "}
        <Link href="/student" className="hover:text-emerald-500 transition-colors">
          Student Portal
        </Link>
      </footer>
    </div>
  );
}
