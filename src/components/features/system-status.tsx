"use client";

import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, Server, Wifi } from "lucide-react";
import { CORE_TELEMETRY } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const SystemStatus: React.FC = () => {
  const [metrics, setMetrics] = useState(CORE_TELEMETRY);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Just now");
  const [isLive, setIsLive] = useState<boolean>(true);

  // Micro-fluctuation to give realistic live telemetry feel
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => {
          if (m.id === "tps") {
            const base = 142850;
            const delta = Math.floor(Math.random() * 2000) - 1000;
            return {
              ...m,
              value: (base + delta).toLocaleString(),
            };
          }
          if (m.id === "latency") {
            const val = (18.2 + Math.random() * 0.5).toFixed(1);
            return {
              ...m,
              value: val,
            };
          }
          return m;
        })
      );
      setLastRefreshed(new Date().toLocaleTimeString());
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <section id="telemetry" className="py-16 md:py-24 relative border-t border-slate-900 bg-slate-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
                Real-Time Telemetry
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Autonomous Mesh Diagnostics
            </h2>
            <p className="text-slate-400 mt-2 max-w-xl text-sm sm:text-base">
              Live status streamed from globally synchronized validator quorums and hardware neural accelerators.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="emerald" pulse className="px-3 py-1 text-xs">
              Quorum: Synced
            </Badge>
            <button
              onClick={() => setIsLive(!isLive)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-900/80 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLive ? "animate-spin text-cyan-400" : ""}`} />
              <span>{isLive ? "Streaming" : "Paused"}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <Card
              key={metric.id}
              glow
              className="relative overflow-hidden bg-slate-950/70 border-slate-800 hover:border-cyan-500/40 transition-all duration-300"
            >
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {metric.name}
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {metric.change}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                  {metric.value}
                </div>
                <div className="text-sm font-semibold text-cyan-400 font-mono">
                  {metric.unit}
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                {metric.description}
              </p>

              {/* Progress bar visual indicator */}
              <div className="mt-4 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(metric.numericValue, 100)}%` }}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Cluster Network Status Banner */}
        <div className="mt-8 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-slate-950/90 p-5 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                Primary Cluster: US-East / EU-Central / AP-East
                <Badge variant="cyan" className="py-0 text-[10px]">Active Mesh</Badge>
              </div>
              <div className="text-xs text-slate-400">
                Deterministic block replication interval: 400ms &bull; Zero Byzantine faults detected
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              <span>Packet Drop: 0.0001%</span>
            </div>
            <div className="text-slate-600">|</div>
            <div className="text-slate-500">Updated {lastRefreshed}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
