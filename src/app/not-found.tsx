import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return <main className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center bg-slate-50">
    <span className="rounded-2xl bg-indigo-50 p-4 text-indigo-600"><Compass size={30} /></span>
    <p className="mt-6 text-xs font-semibold tracking-widest text-slate-400">404 / PAGE NOT FOUND</p>
    <h1 className="mt-3 text-3xl font-semibold text-slate-900">Let&apos;s get you back on track.</h1>
    <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">This page may have moved, or the link may be incomplete. Choose your portal from the home page.</p>
    <Link href="/" className="portal-primary mt-7"><ArrowLeft size={16} />Back to home</Link>
  </main>;
}
