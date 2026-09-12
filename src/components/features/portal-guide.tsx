import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Video, Zap } from "lucide-react";
import type { UserRole } from "@/types";

export function PortalGuide({ role }: { role: UserRole }) {
  const teaching = role === "teacher";
  const steps = teaching ? [
    ["Make it yours", "Add your subjects, a short introduction, and a profile photo so your expertise has a home."],
    ["Choose your hours", "Create availability slots or go online when you’re ready for a live session request."],
    ["Focus on the session", "Connect over video, share your screen, and keep your teaching history in one place."],
  ] : [
    ["Follow your curiosity", "Browse subjects and mentor profiles to find help with the question in front of you."],
    ["Find a moment", "Request a session with an online mentor or choose an available time that fits your day."],
    ["Make progress together", "Talk it through over video, share your screen, and leave feedback after your session."],
  ];
  return <div className="portal-auth" data-portal={role}>
    <header className="portal-auth-header"><Link href={`/${role}/login`} className="portal-brand"><span className="portal-brand-icon"><Zap size={20} /></span>utopians<span className="portal-brand-light">core</span></Link><Link href={`/${role}/login`} className="portal-label">Sign in<ArrowRight size={14} /></Link></header>
    <main className="max-w-5xl mx-auto px-6 py-12 sm:py-20">
      <p className="portal-eyebrow">THE {teaching ? "TEACHING" : "LEARNING"} GUIDE</p>
      <h1 className="text-4xl sm:text-6xl tracking-tight font-semibold max-w-2xl mt-6 leading-[1.15]">{teaching ? "Your expertise deserves a space of its own." : "Big ideas start with small questions."}</h1>
      <p className="text-slate-500 text-base leading-8 max-w-xl mt-6">{teaching ? "A simple rhythm for your teaching day, from setting your availability to wrapping up a session." : "From your first question to your next breakthrough, keep your learning simple, personal, and on your schedule."}</p>
      <Link href={`/${role}/signup`} className="portal-primary w-fit mt-8">{teaching ? "Create your teaching account" : "Start your learning journey"}<ArrowRight size={17} /></Link>
      <div className="grid md:grid-cols-3 gap-6 mt-16">{steps.map(([title, description], index) => {
        const Icon = [BookOpen, CalendarDays, Video][index];
        return <section key={title} className="rounded-2xl bg-white border border-slate-200 p-7"><span className="portal-form-icon"><Icon size={22} /></span><p className="portal-eyebrow mt-7">STEP 0{index + 1}</p><h2 className="text-lg font-semibold mt-3">{title}</h2><p className="text-sm leading-7 text-slate-500 mt-3">{description}</p></section>;
      })}</div>
      <div className="border-t border-slate-200 mt-14 pt-8 flex flex-wrap gap-4 items-center justify-between"><p className="text-sm text-slate-500">Already have an account? Your workspace is ready.</p><Link href={`/${role}/login`} className="text-sm font-semibold flex items-center gap-2">Go to your portal<ArrowRight size={16} /></Link></div>
    </main>
  </div>;
}
