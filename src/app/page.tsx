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
  ShieldCheck,
  Clock,
  Code2,
  Compass,
} from "lucide-react";
import { useAuthContext } from "@/context/auth-context";

export default function HomePage() {
  const { role, isAuthenticated, signOut } = useAuthContext();
  const currentYear = new Date().getFullYear();

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

          {/* Nav Links (Informational) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Platform Features
            </a>
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
                  <span>My Dashboard</span>
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
                  href="/students"
                  className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-xs"
                >
                  Students Portal
                </Link>
                <Link
                  href="/teachers"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-xs"
                >
                  Teachers Portal
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-14 md:pt-24 md:pb-20">
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
            Connect with expert mentors for live, on-demand micro-sessions.
            Direct browser-to-browser WebRTC video, screen sharing, and interactive learning.
            No lengthy courses—just real-time help when you need it.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1 border border-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Zero Subscriptions
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1 border border-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" /> Native WebRTC Calling
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1 border border-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-violet-600" /> Verified Subject Experts
            </span>
          </div>
        </div>
      </section>

      {/* 3. Two Dedicated Portal Entry Cards */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Students Portal */}
          <div className="group relative rounded-2xl border border-indigo-100 bg-white p-8 sm:p-10 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 font-mono bg-indigo-50/60 px-2.5 py-1 rounded-full border border-indigo-100/80">
                  Students Portal
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  I&apos;m a Student
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Browse verified online mentors, request instant 1-on-1 micro-sessions, and get unstuck in minutes.
                </p>
              </div>

              <div className="pt-3 space-y-2.5 text-xs sm:text-sm text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Instant live tutor matching under 60 seconds</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Private encrypted video room &amp; screen sharing</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Dedicated student dashboard with session history &amp; reviews</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-100">
              <Link href="/students" className="block w-full">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <span>Enter Students Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>

          {/* Card 2: Teachers Portal */}
          <div className="group relative rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs group-hover:scale-105 transition-transform">
                  <BookOpen className="h-7 w-7" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 font-mono bg-emerald-50/60 px-2.5 py-1 rounded-full border border-emerald-100/80">
                  Teachers Portal
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  I&apos;m a Teacher
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Turn your expertise into income. Toggle online availability and receive real-time teaching requests.
                </p>
              </div>

              <div className="pt-3 space-y-2.5 text-xs sm:text-sm text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Full control over availability slots &amp; live presence</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Receive pop-up session notifications in real time</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Showcase bio, ratings, subject skills, and portfolio</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-100">
              <Link href="/teachers" className="block w-full">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <span>Enter Teachers Portal</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
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
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 space-y-4 hover:bg-slate-50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-600 font-bold">
                <Search className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-indigo-600">STEP 01</div>
                <h3 className="text-xl font-bold text-slate-900">Search Mentor</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Filter verified teachers who are live and online right now by subject, programming language, or academic topic.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 space-y-4 hover:bg-slate-50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-600 font-bold">
                <Video className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-indigo-600">STEP 02</div>
                <h3 className="text-xl font-bold text-slate-900">Connect in Live Room</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Send an instant session request. When accepted, jump straight into a private, peer-to-peer WebRTC call with zero downloads.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 space-y-4 hover:bg-slate-50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-600 font-bold">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-indigo-600">STEP 03</div>
                <h3 className="text-xl font-bold text-slate-900">Learn &amp; Review</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Walk through problems together, share screens, review answers, and leave transparent feedback once finished.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Platform Features Section */}
      <section id="features" className="border-t border-slate-200/80 bg-slate-50/50 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12 sm:mb-16">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 font-mono">
              Engineered For Speed
            </h3>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Built with cutting-edge tech
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              No third-party iframe bottlenecks. Powered by low-latency browser-to-browser protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Native WebRTC Video</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Peer-to-peer audio and video signaling via Supabase Realtime for zero lag and crystal-clear calls.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Availability Scheduling</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Book sessions in advance or request live instant tutoring based on teachers&apos; real-time calendars.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Strict Role Isolation</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Independent authentication portals ensure students and teachers maintain dedicated workspaces.
              </p>
            </div>
          </div>

          {/* Trust Metrics Pill */}
          <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">&lt; 30s</div>
              <div className="text-xs text-slate-500 mt-1">Average Response</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">100%</div>
              <div className="text-xs text-slate-500 mt-1">Verified Mentors</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">P2P</div>
              <div className="text-xs text-slate-500 mt-1">Encrypted Video</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">Zero</div>
              <div className="text-xs text-slate-500 mt-1">Subscription Lock-in</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-10 text-center mt-auto">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-600 fill-current" />
            <span className="font-semibold text-slate-700">Utopians Core</span>
            <span>&bull;</span>
            <span>&copy; {currentYear} Utopians Core. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/for-students" className="hover:text-slate-900 transition-colors">
              For Students
            </Link>
            <Link href="/for-teachers" className="hover:text-slate-900 transition-colors">
              For Teachers
            </Link>
            <Link href="/students" className="hover:text-slate-900 transition-colors font-medium text-indigo-600">
              Students Portal
            </Link>
            <Link href="/teachers" className="hover:text-slate-900 transition-colors font-medium text-slate-800">
              Teachers Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
