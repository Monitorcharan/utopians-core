"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Terminal, Copy, Check, ShieldCheck, Cpu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const HeroSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const command = "npx utopians-core init --template agent-mesh";

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="overview" className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
      {/* Background glow & decorative elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 to-purple-600/10 blur-[120px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Version pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs text-cyan-300 backdrop-blur-md">
            <Badge variant="cyan" pulse className="px-1.5 py-0">
              CORE v1.4
            </Badge>
            <span className="text-slate-300">Intelligent State Engine is Live</span>
            <ArrowRight className="h-3 w-3 text-cyan-400" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.15]">
            Architecting the{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Autonomous Core
            </span>{" "}
            for Next-Gen Intelligence
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
            High-throughput verifiable execution, microsecond DAG consensus, and distributed neural pipelines built to coordinate millions of autonomous agents.
          </p>

          {/* CTA & CLI Command */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center pt-2">
            <Link href="#architecture">
              <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 text-base px-7">
                Explore Architecture
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#modules">
              <Button variant="glass" size="lg" className="w-full sm:w-auto gap-2 text-base px-6">
                <Terminal className="h-4 w-4 text-cyan-400" />
                Inspect Modules
              </Button>
            </Link>
          </div>

          {/* Copyable CLI Snippet */}
          <div className="w-full max-w-md pt-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/80 px-4 py-2.5 font-mono text-xs sm:text-sm text-slate-300 shadow-inner">
              <div className="flex items-center gap-2 truncate">
                <span className="text-cyan-400 select-none">$</span>
                <span className="truncate">{command}</span>
              </div>
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Copy to clipboard"
                aria-label="Copy install command"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Mini Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-8 text-left">
            <Card className="p-4 bg-slate-950/50 border-slate-800/80 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-500/20">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">140k+ TPS</div>
                  <div className="text-xs text-slate-400">Deterministic Parallelism</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-slate-950/50 border-slate-800/80 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-500/20">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">&lt; 20ms Finality</div>
                  <div className="text-xs text-slate-400">Sub-second state commit</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-slate-950/50 border-slate-800/80 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Post-Quantum Safe</div>
                  <div className="text-xs text-slate-400">Lattice-based cryptography</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
