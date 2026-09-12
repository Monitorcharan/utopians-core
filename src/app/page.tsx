import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Zap, Video, CalendarDays, MessageCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-800">
      <header className="max-w-6xl mx-auto px-6 sm:px-10 py-7 flex items-center justify-between">
        <Link href="/" className="portal-brand"><span className="portal-brand-icon"><Zap size={20} /></span>utopians<span className="portal-brand-light">core</span></Link>
        <span className="text-xs text-slate-400 hidden sm:block">A little connection. A lot of possibility.</span>
      </header>
      <main className="max-w-5xl mx-auto px-6 pt-12 sm:pt-20 pb-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[10px] tracking-[.2em] font-semibold text-indigo-600">LIVE LEARNING, MADE PERSONAL</p>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-[-.04em] leading-[1.13] mt-6">Good questions deserve<br /><span className="text-indigo-600">a real conversation.</span></h1>
          <p className="text-slate-500 text-sm sm:text-base leading-8 max-w-lg mx-auto mt-6">Learn something new. Share what you know. Find your own space for focused, one-to-one sessions.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5 mt-12 sm:mt-16">
          {([
            { role: "student", label: "For the curious", title: "I am here to learn", description: "Get unstuck, explore a subject, and make your next step a little clearer.", icon: GraduationCap, action: "Enter student portal", tags: "Discover / Book / Learn" },
            { role: "teacher", label: "For the knowledge sharers", title: "I am here to teach", description: "Bring your expertise to a workspace built around your schedule and your sessions.", icon: BookOpen, action: "Enter teacher portal", tags: "Plan / Connect / Teach" },
          ] as const).map(item => <section key={item.role} data-portal={item.role} className="bg-white rounded-3xl border border-slate-200 p-7 sm:p-9 flex flex-col">
            <div className="flex justify-between items-center"><span className="portal-form-icon mb-0"><item.icon size={23} /></span><span className="text-[10px] tracking-wide text-slate-400">{item.tags}</span></div>
            <p className="portal-eyebrow mt-8">{item.label.toUpperCase()}</p><h2 className="text-2xl font-semibold mt-3">{item.title}</h2><p className="text-sm leading-7 text-slate-500 mt-3 mb-8 flex-1">{item.description}</p>
            <Link href={`/${item.role}/login`} className="portal-primary">{item.action}<ArrowRight size={17} /></Link>
            <Link href={`/for-${item.role}s`} className="text-center text-xs text-slate-500 mt-5 hover:text-slate-900">Explore how it works</Link>
          </section>)}
        </div>
        <div className="flex flex-wrap justify-center gap-5 sm:gap-10 mt-10 text-xs text-slate-400"><span className="flex items-center gap-2"><Video size={15} />Live video sessions</span><span className="flex items-center gap-2"><CalendarDays size={15} />Flexible scheduling</span><span className="flex items-center gap-2"><MessageCircle size={15} />Space for your questions</span></div>
      </main>
      <footer className="max-w-6xl mx-auto px-6 py-6 border-t border-slate-200 text-[11px] text-slate-400 flex justify-between"><span>Utopians Core</span><span>Progress starts with a conversation.</span></footer>
    </div>
  );
}
