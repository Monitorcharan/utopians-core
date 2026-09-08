import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <Compass className="h-10 w-10 animate-spin" style={{ animationDuration: "12s" }} />
      </div>
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-cyan-400">
        404 // State Vector Not Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
        Requested Block Does Not Exist
      </h1>
      <p className="text-slate-400 max-w-md mt-3 text-sm leading-relaxed">
        The coordinate or route you are looking for has either been pruned from state or does not reside on this ledger path.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button variant="primary" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Core Ledger
          </Button>
        </Link>
      </div>
    </div>
  );
}
