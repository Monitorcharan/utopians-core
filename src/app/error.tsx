"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Page failed to load:", error); }, [error]);
  return <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
    <span className="rounded-2xl bg-rose-50 p-4 text-rose-500"><AlertCircle size={30} /></span>
    <h1 className="mt-6 text-2xl font-semibold text-slate-900">We could not load this page.</h1>
    <p className="mt-3 text-sm text-slate-500">Please try again. Your account and saved sessions are still there.</p>
    <button onClick={reset} className="portal-primary mt-7"><RotateCcw size={16} />Try again</button>
  </div>;
}
