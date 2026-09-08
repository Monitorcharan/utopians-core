"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  DollarSign,
  Clock,
  Globe,
  Sparkles,
  ArrowRight,
  Laptop,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ForTeachersPage() {
  const currentYear = new Date().getFullYear();
  const [weeklyHours, setWeeklyHours] = useState(10);
  const hourlyRate = 45;
  const estimatedWeekly = weeklyHours * hourlyRate;
  const estimatedMonthly = estimatedWeekly * 4;

  const perks = [
    {
      icon: Clock,
      title: "Complete Schedule Freedom",
      description:
        "No rigid timetables or mandatory weekly commitments. Flip your toggle to 'Online' when you have free time, and switch it off when you're done.",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      icon: DollarSign,
      title: "Transparent & Fast Payouts",
      description:
        "Earn competitive rates per minute or hour. Track your daily earnings in real-time on your dashboard, with automatic weekly direct deposits.",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      icon: Laptop,
      title: "All-in-One Teaching Studio",
      description:
        "Everything is built directly into Utopians Core: WebRTC video, live collaborative code environments, and shared whiteboards. No Zoom subscriptions needed.",
      color: "text-violet-600 bg-violet-50 border-violet-100",
    },
    {
      icon: Globe,
      title: "Global Reach of Motivated Students",
      description:
        "Connect with thousands of eager students from universities and bootcamps worldwide who come prepared with specific questions.",
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Build Your Profile",
      description:
        "Sign up in 2 minutes. List your subjects and technical skills—such as Python, Discrete Math, React, or Organic Chemistry.",
      icon: Users,
    },
    {
      step: "02",
      title: "Flip Your Status to 'Online'",
      description:
        "Whenever you're ready to teach, toggle your availability switch. You instantly appear in student discovery searches.",
      icon: Zap,
    },
    {
      step: "03",
      title: "Accept Calls & Earn",
      description:
        "Receive real-time incoming call alerts with student details. One click to accept, enter the private video room, and teach.",
      icon: DollarSign,
    },
  ];

  const faqs = [
    {
      q: "How do I get paid?",
      a: "Earnings accrue automatically after every completed session based on instructional minutes. Payouts are transferred weekly via direct deposit.",
    },
    {
      q: "Do I have to commit to specific hours?",
      a: "Never! You have 100% control over when and how long you work. Log on for 15 minutes between meetings or 4 hours on a weekend.",
    },
    {
      q: "What equipment do I need?",
      a: "All you need is a computer (laptop or desktop) with a modern web browser, a reliable internet connection, a webcam, and a clear microphone.",
    },
    {
      q: "What subjects can I teach?",
      a: "From computer science, web development, and machine learning to calculus, physics, chemistry, languages, and interview prep.",
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
                For Teachers &amp; Mentors
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link href="/for-students" className="hover:text-indigo-600 transition-colors">
              Student Platform
            </Link>
            <Link href="#earnings" className="hover:text-indigo-600 transition-colors">
              Earning Potential
            </Link>
            <Link href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/teacher/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            >
              Teacher Login
            </Link>
            <Link href="/teacher/signup">
              <Button variant="primary" size="sm" className="font-semibold shadow-xs">
                Apply to Teach
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-16 md:pt-24 md:pb-24">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-gradient-to-tr from-emerald-100/60 via-indigo-100/40 to-teal-50/30 blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span>Turn Your Expertise Into High-Income Flexibility</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.1]">
            Teach on your own terms.{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 bg-clip-text text-transparent">
              Earn while you inspire.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            No scheduling headaches, unpaid cancellations, or lesson planning. Whenever you have free time, flip your toggle to Online and accept live 1-on-1 tutoring requests.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link href="/teacher/signup" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto gap-2 font-bold shadow-md shadow-indigo-500/20 text-base"
              >
                <span>Become an Instructor</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/teacher/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 text-slate-700 hover:text-slate-900 text-base font-semibold"
              >
                <span>Instructor Dashboard</span>
              </Button>
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-slate-200/60 max-w-4xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">$35 - $90+</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Average Hourly Range</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Schedule Autonomy</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">Weekly</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Direct Payouts</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">1-Click</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Online/Offline Toggle</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Earning Potential Calculator */}
      <section id="earnings" className="py-16 md:py-20 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-mono">
              Earning Calculator
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Calculate Your Teaching Earnings
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              See how much you can earn per week and month based on how many hours you choose to teach.
            </p>
          </div>

          {/* Calculator Card */}
          <Card className="p-8 sm:p-12 border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left slider */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-900 mb-2">
                    <span>Hours Teaching Per Week:</span>
                    <span className="text-indigo-600 text-xl font-extrabold font-mono">
                      {weeklyHours} hrs/week
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={40}
                    step={1}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1.5 font-mono">
                    <span>2 hrs (casual)</span>
                    <span>20 hrs (part-time)</span>
                    <span>40 hrs (full-time)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Estimated Baseline Rate:</span>
                    <span className="font-bold text-slate-900 font-mono">${hourlyRate}.00 / hr</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payout Frequency:</span>
                    <span className="font-bold text-emerald-600">Weekly Every Friday</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Platform Setup Fee:</span>
                    <span className="font-bold text-slate-900">$0.00 (100% Free)</span>
                  </div>
                </div>
              </div>

              {/* Right Output */}
              <div className="rounded-2xl bg-gradient-to-tr from-indigo-900 to-indigo-950 p-8 text-white text-center space-y-4 shadow-md">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 font-mono">
                  Estimated Take-Home Income
                </span>
                <div>
                  <div className="text-4xl sm:text-5xl font-black tracking-tight text-emerald-400 font-mono">
                    ${estimatedMonthly.toLocaleString()}
                  </div>
                  <span className="text-xs text-indigo-200 mt-1 block">per month</span>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-around text-xs">
                  <div>
                    <span className="text-indigo-300 block">Weekly</span>
                    <span className="font-bold text-white text-base">${estimatedWeekly.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-indigo-300 block">Annual Potential</span>
                    <span className="font-bold text-white text-base">${(estimatedMonthly * 12).toLocaleString()}</span>
                  </div>
                </div>

                <Link href="/teacher/signup" className="block pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                  >
                    Start Earning Today
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. Instructor Perks */}
      <section className="py-16 md:py-24 bg-[#F9FAFB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono">
              Designed For Educators
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Why Instructors Choose Utopians Core
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              We built the platform to eliminate everything tutors hate: scheduling hassles, no-shows, and complicated invoicing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {perks.map((perk, idx) => {
              const Icon = perk.icon;
              return (
                <Card
                  key={idx}
                  hoverEffect
                  className="p-6 sm:p-8 border-slate-200/80 bg-white hover:border-indigo-200 transition-all space-y-3"
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${perk.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{perk.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {perk.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-20 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono">
              The Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              How Teaching Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Go from signing up to conducting your first paid live tutoring session in 3 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200/90 shadow-2xs space-y-4"
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

      {/* 6. FAQ Section */}
      <section className="py-16 md:py-20 bg-[#F9FAFB]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="p-6 bg-white border-slate-200/80">
                <h4 className="text-base font-bold text-slate-900">{faq.q}</h4>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA Banner */}
      <section className="py-16 md:py-20 bg-white border-t border-slate-200/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-8 sm:p-14 text-center text-white shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300 border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Join the Top 5% of Online Educators</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to Start Earning on Your Schedule?
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-300">
              Sign up today and experience the easiest, most rewarding way to share your knowledge.
            </p>
            <div className="pt-2">
              <Link href="/teacher/signup">
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 text-base shadow-sm"
                >
                  Apply as a Teacher
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
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
            <Link href="/for-students" className="hover:text-slate-900">
              For Students
            </Link>
            <Link href="/for-teachers" className="text-indigo-600 font-semibold">
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
