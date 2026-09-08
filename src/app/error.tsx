"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Utopians Core Runtime Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-400 mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-red-400">
        Fatal Runtime Interruption
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
        Subsystem Exception Caught
      </h1>
      <p className="text-slate-400 max-w-md mt-3 text-sm leading-relaxed">
        An unhandled fault occurred within the core execution boundary. You can attempt to soft-reset the state engine below.
      </p>
      {error.digest && (
        <div className="mt-4 font-mono text-xs text-slate-500 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded">
          Error Digest: {error.digest}
        </div>
      )}
      <div className="mt-8 flex gap-4">
        <Button variant="primary" onClick={() => reset()} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Soft Reset Engine
        </Button>
      </div>
    </div>
  );
}
