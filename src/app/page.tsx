"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  GraduationCap,
  BookOpen,
  Search,
  Video,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuthContext } from "@/context/auth-context";

export default function HomePage() {
  const { role, isAuthenticated, signOut } = useAuthContext();
  const currentYear = new Date().getFullYear();

  // Used only for the header dashboard nav link
  const userDashboard =
    role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-slate-50/50 to-indigo-50/30 text-slate-900 font-sans selection:bg-indigo-500/10 selection:text-indigo-600">
      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="font-semibold text-slate-900 text-lg tracking-tight">
              Utopians<span className="text-indigo-600">Core</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link href="/for-students" className="hover:text-indigo-600 transition-colors">
              For Students
            </Link>
            <Link href="/for-teachers" className="hover:text-indigo-600 transition-colors">
              For Teachers
            </Link>
          </nav>

          {/* Nav Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href={userDashboard}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-xs"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 transition-all cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/student/login"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 transition-all shadow-xs"
                >
                  Student Login
                </Link>
                <Link
                  href="/teacher/login"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 transition-all shadow-xs"
                >
                  Teacher Login
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-14 md:pt-24 md:pb-20">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-pink-100/20 blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 px-3.5 py-1 text-xs font-medium text-indigo-700 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
            </span>
            <span>Live On-Demand Mentorship Platform</span>
          </div>

          {/* Large Bold Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.1]">
            Learn anything.{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Instantly.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto max-w-2xl text-base sm:text-xl text-slate-600 leading-relaxed font-normal">
            Connect with expert teachers for live, on-demand micro-sessions. No
            courses, just help when you need it.
          </p>
        </div>
      </section>

      {/* 3. Two Large Call-To-Action Cards */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Student */}
          <div className="group relative rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 font-mono bg-indigo-50/60 px-2.5 py-1 rounded-full border border-indigo-100/80">
                  For Students
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  I&apos;m a Student
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Find a teacher online right now for any topic.
                </p>
              </div>

              <div className="pt-3 space-y-2.5 text-xs sm:text-sm text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Instant live tutor matching in seconds</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>HD 1-on-1 video call &amp; screen share</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Ask anything — from debug sessions to exam prep</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-100 space-y-3">
              <Link
                href={
                  !isAuthenticated
                    ? "/student/signup"
                    : role === "student"
                    ? "/student/dashboard"
                    : "/student/signup" // Teacher visiting — signup page will show role conflict banner
                }
                className="block w-full"
              >
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <span>
                    {!isAuthenticated
                      ? "I'm a Student"
                      : role === "student"
                      ? "Go to Student Dashboard"
                      : "Switch to Student Account"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              {!isAuthenticated && (
                <p className="text-center text-xs text-slate-500">
                  Already registered?{" "}
                  <Link
                    href="/student/login"
                    className="text-indigo-600 hover:text-indigo-500 font-medium underline underline-offset-2"
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Teacher */}
          <div className="group relative rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 shadow-xs group-hover:scale-105 transition-transform">
                  <BookOpen className="h-7 w-7" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 font-mono bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/80">
                  For Teachers
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  I&apos;m a Teacher
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Turn your knowledge into income. Go online and teach.
                </p>
              </div>

              <div className="pt-3 space-y-2.5 text-xs sm:text-sm text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Teach whenever you want with single toggle availability</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Receive instant pop-up requests from active students</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Share your skills across code, math, science, and languages</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-100 space-y-3">
              <Link
                href={
                  !isAuthenticated
                    ? "/teacher/signup"
                    : role === "teacher"
                    ? "/teacher/dashboard"
                    : "/teacher/signup" // Student visiting — signup page will show role conflict banner
                }
                className="block w-full"
              >
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer"
                >
                  <span>
                    {!isAuthenticated
                      ? "Start Teaching"
                      : role === "teacher"
                      ? "Go to Teacher Dashboard"
                      : "Switch to Teacher Account"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              </Link>
              {!isAuthenticated && (
                <p className="text-center text-xs text-slate-500">
                  Already registered?{" "}
                  <Link
                    href="/teacher/login"
                    className="text-indigo-600 hover:text-indigo-500 font-medium underline underline-offset-2"
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12 sm:mb-16">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 font-mono">
              Simple Process
            </h3>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              How it works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Get connected with an expert in three straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Search */}
            <div className="relative rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 space-y-4 hover:bg-slate-50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-600 font-bold">
                <Search className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-indigo-600">
                  STEP 01
                </div>
                <h3 className="text-xl font-bold text-slate-900">Search</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Browse verified teachers who are live and online right now. Filter
                instantly by subject, technical stack, or topic.
              </p>
            </div>

            {/* Step 2: Connect */}
            <div className="relative rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 space-y-4 hover:bg-slate-50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-600 font-bold">
                <Video className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-indigo-600">
                  STEP 02
                </div>
                <h3 className="text-xl font-bold text-slate-900">Connect</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Click &quot;Request Session&quot; to send an instant real-time notification
                to the teacher. When they accept, a private room is created.
              </p>
            </div>

            {/* Step 3: Learn */}
            <div className="relative rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 space-y-4 hover:bg-slate-50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-600 font-bold">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-indigo-600">
                  STEP 03
                </div>
                <h3 className="text-xl font-bold text-slate-900">Learn</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Jump directly into your private video call. Solve roadblocks, review
                concepts, and finish with a single click.
              </p>
            </div>
          </div>

          {/* Trust Metrics Pill */}
          <div className="mt-14 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                &lt; 30s
              </div>
              <div className="text-xs text-slate-500 mt-1">Average Response</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                100%
              </div>
              <div className="text-xs text-slate-500 mt-1">Verified Mentors</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                Private
              </div>
              <div className="text-xs text-slate-500 mt-1">Encrypted Video</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                Zero
              </div>
              <div className="text-xs text-slate-500 mt-1">Long-term Commitments</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-slate-50/80 py-8 text-center mt-auto">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-600 fill-current" />
            <span className="font-semibold text-slate-700">Utopians Core</span>
            <span>&bull;</span>
            <span>&copy; {currentYear} Utopians Core. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/for-students"
              className="hover:text-slate-900 transition-colors"
            >
              For Students
            </Link>
            <Link
              href="/for-teachers"
              className="hover:text-slate-900 transition-colors"
            >
              For Teachers
            </Link>
            <Link
              href="/student/login"
              className="hover:text-slate-900 transition-colors"
            >
              Student Portal
            </Link>
            <Link
              href="/teacher/login"
              className="hover:text-slate-900 transition-colors"
            >
              Teacher Portal
            </Link>
            <span className="text-slate-400">Privacy &amp; Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
