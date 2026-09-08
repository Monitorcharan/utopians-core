"use client";

import React, { useState } from "react";
import { Layers, CheckCircle2, Shield, Network, Database, Cpu } from "lucide-react";
import { ARCHITECTURE_LAYERS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const ArchitectureView: React.FC = () => {
  const [activeLayerId, setActiveLayerId] = useState<string>(ARCHITECTURE_LAYERS[0].id);

  const activeLayer =
    ARCHITECTURE_LAYERS.find((layer) => layer.id === activeLayerId) || ARCHITECTURE_LAYERS[0];

  const layerIcons: Record<string, React.ReactNode> = {
    application: <Cpu className="h-5 w-5 text-cyan-400" />,
    consensus: <Shield className="h-5 w-5 text-indigo-400" />,
    data: <Database className="h-5 w-5 text-emerald-400" />,
    network: <Network className="h-5 w-5 text-amber-400" />,
  };

  return (
    <section id="architecture" className="py-16 md:py-24 border-t border-slate-900 bg-slate-950/60 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
              System Stack
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Layered Core Architecture
          </h2>
          <p className="text-slate-400 mt-3 text-base sm:text-lg leading-relaxed">
            Engineered from ground-up using decoupled execution tiers, zero-copy state pipes, and deterministic state guarantees.
          </p>
        </div>

        {/* Interactive Architecture Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Layer Selector Stack */}
          <div className="lg:col-span-5 space-y-3">
            {ARCHITECTURE_LAYERS.map((layer) => {
              const isActive = layer.id === activeLayerId;

              return (
                <div
                  key={layer.id}
                  onClick={() => setActiveLayerId(layer.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                    isActive
                      ? "bg-slate-900/90 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.25)] translate-x-1"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        isActive
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      {layerIcons[layer.id] || <Layers className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-mono text-cyan-400">
                        {layer.subtitle}
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {layer.title}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={isActive ? "cyan" : "slate"} className="text-[10px] font-mono">
                      {layer.latency}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Layer Detail Inspector */}
          <div className="lg:col-span-7">
            <Card glow className="bg-slate-950/80 border-slate-800 p-8 relative overflow-hidden">
              {/* Subtle watermarked layer badge */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                    {activeLayer.subtitle}
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    {activeLayer.title}
                  </h3>
                </div>
                <Badge variant="emerald" pulse className="px-3 py-1 font-mono text-xs">
                  {activeLayer.status.toUpperCase()}
                </Badge>
              </div>

              <p className="text-slate-300 text-base leading-relaxed mb-6">
                {activeLayer.description}
              </p>

              {/* Technologies / Protocols in this layer */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Integrated Protocols &amp; Subroutines
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {activeLayer.technologies.map((tech) => (
                    <div
                      key={tech}
                      className="flex items-center gap-2.5 rounded-lg border border-slate-800/80 bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-200"
                    >
                      <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span className="font-mono">{tech}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Latency SLA & Determinism */}
              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Target Latency Commitment</span>
                <span className="text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded">
                  &le; {activeLayer.latency} P99.9
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
