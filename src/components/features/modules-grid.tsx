"use client";

import React, { useState } from "react";
import { Cpu, ShieldCheck, Zap, Layers, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { CORE_MODULES } from "@/lib/constants";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="h-6 w-6 text-cyan-400" />,
  ShieldCheck: <ShieldCheck className="h-6 w-6 text-emerald-400" />,
  Zap: <Zap className="h-6 w-6 text-amber-400" />,
  Layers: <Layers className="h-6 w-6 text-purple-400" />,
};

export const ModulesGrid: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  return (
    <section id="modules" className="py-16 md:py-24 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
              Core Subsystems
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Modular Intelligence Subsystems
          </h2>
          <p className="text-slate-400 mt-3 text-base sm:text-lg leading-relaxed">
            Pluggable high-performance kernels designed for zero-overhead integration with native agent runtimes and cryptographic backplanes.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CORE_MODULES.map((module) => {
            const isSelected = selectedModule === module.id;

            return (
              <Card
                key={module.id}
                interactive
                className={`relative flex flex-col justify-between overflow-hidden bg-slate-950/60 border-slate-800 transition-all duration-300 ${
                  isSelected ? "ring-2 ring-cyan-400 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]" : ""
                }`}
                onClick={() => setSelectedModule(isSelected ? null : module.id)}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      {iconMap[module.icon] || <Cpu className="h-6 w-6 text-cyan-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        {module.category}
                      </span>
                      {module.badge && (
                        <Badge variant="cyan" className="text-[10px]">
                          {module.badge}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardTitle className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {module.title}
                  </CardTitle>
                  <div className="text-xs text-cyan-400 font-mono mt-1">
                    {module.tagline}
                  </div>

                  <CardDescription className="text-slate-300 mt-3 text-sm leading-relaxed">
                    {module.description}
                  </CardDescription>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                      {module.metrics.label}
                    </span>
                    <span className="text-sm font-semibold text-white font-mono">
                      {module.metrics.value}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 hover:border-cyan-500/50 hover:text-cyan-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModule(isSelected ? null : module.id);
                    }}
                  >
                    {isSelected ? "Active" : "Inspect"}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2 bg-cyan-950/20 -mx-6 -mb-6 p-4">
                    <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Module loaded into live debug inspector. Wasm microkernel operational.</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
