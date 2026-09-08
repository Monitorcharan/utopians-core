import React from "react";
import { Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-black shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-pulse">
        <Sparkles className="h-7 w-7 fill-current" />
      </div>
      <div className="flex flex-col items-center space-y-1">
        <span className="font-mono text-sm font-semibold text-cyan-400 tracking-wider uppercase">
          Initializing Utopians Core
        </span>
        <span className="text-xs text-slate-400">
          Syncing state and cryptographic headers...
        </span>
      </div>
    </div>
  );
}
