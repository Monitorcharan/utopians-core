"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

interface AppLayoutShellProps {
  children: React.ReactNode;
}

export function AppLayoutShell({ children }: AppLayoutShellProps) {
  const pathname = usePathname();
  const isCleanPage =
    pathname === "/" ||
    pathname === "/for-students" ||
    pathname === "/for-teachers" ||
    pathname.startsWith("/student/") ||
    pathname.startsWith("/teacher/") ||
    pathname.startsWith("/session/");

  if (isCleanPage) {
    return (
      <div className="min-h-screen w-full bg-slate-50/60 text-slate-900 antialiased font-sans">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#08090d] text-slate-100 bg-cyber-grid bg-ambient-glow selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
