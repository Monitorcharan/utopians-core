import React from "react";
import { Sparkles, BookOpen, MessageSquare, ArrowUpRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/60">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 text-black shadow-md">
                <Sparkles className="h-4 w-4 fill-current" />
              </div>
              <span className="font-bold text-white tracking-tight text-lg">
                Utopians<span className="text-cyan-400">Core</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Autonomous infrastructure layer engineered for low-latency decentralized compute, verifiable state transitions, and neural agent coordination.
            </p>
            <div className="pt-2">
              <Badge variant="emerald" pulse className="gap-2 py-1">
                Global Consensus: 100% Synced
              </Badge>
            </div>
          </div>

          {/* Architecture Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Architecture
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#architecture" className="hover:text-cyan-400 transition-colors">
                  Neural Mesh Compute
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-cyan-400 transition-colors">
                  DAG Consensus
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-cyan-400 transition-colors">
                  Sparse Merkle State
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-cyan-400 transition-colors">
                  QUIC Multipath Fabric
                </a>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Developers
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href={SITE_CONFIG.socialLinks.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                >
                  Core Documentation
                  <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              </li>
              <li>
                <a
                  href={SITE_CONFIG.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                >
                  GitHub Repository
                  <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              </li>
              <li>
                <a href="#telemetry" className="hover:text-cyan-400 transition-colors">
                  Real-time Benchmarks
                </a>
              </li>
              <li>
                <a href="#modules" className="hover:text-cyan-400 transition-colors">
                  Microkernel SDK
                </a>
              </li>
            </ul>
          </div>

          {/* Network & Community */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Ecosystem
            </h4>
            <div className="flex gap-3 pt-1">
              <a
                href={SITE_CONFIG.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                aria-label="GitHub"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href={SITE_CONFIG.socialLinks.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                aria-label="Docs"
              >
                <BookOpen className="h-4 w-4" />
              </a>
              <a
                href={SITE_CONFIG.socialLinks.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                aria-label="Discord"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
              <a
                href={SITE_CONFIG.socialLinks.x}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                aria-label="X"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
            <div className="text-xs text-slate-500 pt-2 font-mono">
              Build Hash: 0x8F92...B31A | {SITE_CONFIG.version}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name}. All systems operational.
          </div>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Protocol</span>
            <span className="hover:text-slate-400 cursor-pointer">Security Audit</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Operation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
