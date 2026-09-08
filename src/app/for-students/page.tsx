import React from "react";
import Link from "next/link";
import {
  Zap,
  GraduationCap,
  Sparkles,
  Search,
  Video,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Star,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ForStudentsPage() {
  const currentYear = new Date().getFullYear();

  const benefits = [
    {
      icon: Clock,
      title: "Instant On-Demand Matching",
      description:
        "Stuck on a tricky bug or problem set at 11 PM? Connect with a verified tutor in under 60 seconds without booking days in advance.",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      icon: Video,
      title: "Interactive Video & Code Room",
      description:
        "High-definition video calls paired with real-time collaborative code editors, screen sharing, and interactive diagramming.",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      icon: ShieldCheck,
      title: "Vetted & Verified Mentors",
      description:
        "Every instructor is evaluated for subject mastery, communication, and teaching clarity. Transparent ratings and student reviews.",
      color: "text-violet-600 bg-violet-50 border-violet-100",
    },
    {
      icon: Zap,
      title: "Pay Only For What You Use",
      description:
        "No forced multi-month course subscriptions. Pay micro-session rates or by the minute so you only pay for the exact help you need.",
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Search Your Topic",
      description:
        "Enter any subject—from Linear Algebra and Data Structures to Organic Chemistry or Python. Browse online teachers in real-time.",
      icon: Search,
    },
    {
      step: "02",
      title: "Start Live Session",
      description:
        "Click 'Connect Now' to initiate an instant WebRTC video and collaborative room. No Zoom downloads or awkward links needed.",
      icon: Video,
    },
    {
      step: "03",
      title: "Solve & Review",
      description:
        "Walk through your questions 1-on-1. Once finished, access session replays and notes from your personal student history dashboard.",
      icon: CheckCircle2,
    },
  ];

  const testimonials = [
    {
      quote:
        "I was stuck debugging a recursive graph algorithm for my CS midterm for 3 hours. Within 4 minutes of logging into Utopians Core, a senior engineer walked me through the call stack step-by-step. Scored an A!",
      name: "Alex Rivera",
      major: "Computer Science, Year 3",
      rating: 5,
      avatar: "AR",
    },
    {
      quote:
        "Traditional tutoring services force you into 10-hour contracts. Here, I just jump on for 20 minutes when I need help with multivariable calculus. It's affordable and fast.",
      name: "Maya Patel",
      major: "Mechanical Engineering",
      rating: 5,
      avatar: "MP",
    },
    {
      quote:
        "The live video room with built-in code editor is super smooth. My mentor gave me great tips for my technical interviews and reviewed my React architecture.",
      name: "Jordan Lee",
      major: "Full-Stack Bootcamper",
      rating: 5,
      avatar: "JL",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-lg tracking-tight leading-none">
                Utopians<span className="text-indigo-600">Core</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                For Students
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link href="/for-teachers" className="hover:text-indigo-600 transition-colors">
              Teach on Utopians
            </Link>
            <Link href="/student/discover" className="hover:text-indigo-600 transition-colors">
              Find Tutors
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/student/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            >
              Log In
            </Link>
            <Link href="/student/signup">
              <Button variant="primary" size="sm" className="font-semibold shadow-xs">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-16 md:pt-24 md:pb-24">
        {/* Decorative ambient radial background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-gradient-to-tr from-indigo-100/70 via-violet-100/50 to-pink-50/30 blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            <span>Master Any Subject with 1-on-1 On-Demand Mentorship</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.1]">
            Get unstuck in minutes.{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Learn anything.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            No more staring at roadblocks alone. Connect live with experienced tutors for
            tailored micro-sessions, code debugging, and conceptual breakthroughs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link href="/student/signup" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto gap-2 font-bold shadow-md shadow-indigo-500/20 text-base"
              >
                <span>Start Learning Free</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/student/discover" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 text-slate-700 hover:text-slate-900 text-base font-semibold"
              >
                <Compass className="h-5 w-5 text-indigo-600" />
                <span>Explore Online Mentors</span>
              </Button>
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-slate-200/60 max-w-4xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">&lt; 60s</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Average Match Speed</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">4.9 / 5.0</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Student Rating</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Verified Instructors</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">24 / 7</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Live Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Benefits Grid */}
      <section className="py-16 md:py-20 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono">
              Why Utopians Core?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Designed for Speed, Clarity, &amp; True Understanding
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Skip static 40-hour video courses that don&apos;t answer your questions. Get straight to the answer with interactive 1-on-1 human guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={idx}
                  hoverEffect
                  className="p-6 sm:p-8 border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${benefit.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{benefit.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section className="py-16 md:py-24 bg-[#F9FAFB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              How You Connect with a Mentor
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              No scheduling back-and-forth or rigid calendar invitations. Just search, click, and learn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="relative p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black font-mono text-indigo-200">
                      {step.step}
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Testimonials Section */}
      <section className="py-16 md:py-20 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-mono">
              Student Stories
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Loved by Learners Everywhere
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Hear how students from universities, bootcamps, and high schools boost their grades and confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item, idx) => (
              <Card
                key={idx}
                className="p-6 border-slate-200/90 bg-slate-50/50 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 italic leading-relaxed">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 mt-4 border-t border-slate-200/70">
                  <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {item.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-500">{item.major}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section className="py-16 md:py-20 bg-[#F9FAFB]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-8 sm:p-14 text-center text-white shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Join Thousands of Thriving Students</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to Accelerate Your Learning?
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-indigo-200">
              Create your free student account in 30 seconds and connect with your first verified mentor today.
            </p>
            <div className="pt-2">
              <Link href="/student/signup">
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-white text-indigo-950 hover:bg-slate-100 hover:shadow-lg font-bold px-8 text-base shadow-sm"
                >
                  Sign Up as Student
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className="font-bold text-slate-900">
              Utopians<span className="text-indigo-600">Core</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-slate-900">
              Home
            </Link>
            <Link href="/for-students" className="text-indigo-600 font-semibold">
              For Students
            </Link>
            <Link href="/for-teachers" className="hover:text-slate-900">
              For Teachers
            </Link>
            <Link href="/student/login" className="hover:text-slate-900">
              Student Login
            </Link>
            <Link href="/teacher/login" className="hover:text-slate-900">
              Teacher Login
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            &copy; {currentYear} Utopians Core. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
