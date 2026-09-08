"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExternalLink, Menu, X, Sparkles, GraduationCap, BookOpenCheck } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.7)] transition-all">
            <Sparkles className="h-5 w-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-lg">
                Utopians<span className="text-cyan-400">Core</span>
              </span>
              <Badge variant="emerald" pulse className="hidden sm:inline-flex py-0 px-2 text-[10px]">
                {SITE_CONFIG.status}
              </Badge>
            </div>
            <span className="text-[10px] text-slate-400 -mt-0.5 tracking-wider uppercase font-mono">
              Infrastructure OS
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {SITE_CONFIG.navItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              target={item.isExternal ? "_blank" : undefined}
              rel={item.isExternal ? "noopener noreferrer" : undefined}
              className="text-slate-300 hover:text-cyan-400 font-medium transition-colors flex items-center gap-1.5"
            >
              {item.title}
              {item.badge && (
                <span className="rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 text-[10px] font-mono">
                  {item.badge}
                </span>
              )}
              {item.isExternal && <ExternalLink className="h-3 w-3 text-slate-500" />}
            </Link>
          ))}
        </nav>

        {/* CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/student/login">
            <Button variant="glass" size="sm" className="gap-1.5 text-cyan-300 border-cyan-500/30 hover:border-cyan-400">
              <GraduationCap className="h-4 w-4 text-cyan-400" />
              Student Portal
            </Button>
          </Link>
          <Link href="/teacher/login">
            <Button variant="glass" size="sm" className="gap-1.5 text-purple-300 border-purple-500/30 hover:border-purple-400">
              <BookOpenCheck className="h-4 w-4 text-purple-400" />
              Teacher Portal
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-3 pb-6 space-y-3">
          {SITE_CONFIG.navItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800/80 hover:text-cyan-400"
            >
              <div className="flex items-center justify-between">
                <span>{item.title}</span>
                {item.badge && (
                  <span className="rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 text-xs font-mono">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <Link href="/student/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="glass" className="w-full justify-center gap-2 text-cyan-300 border-cyan-500/40">
                <GraduationCap className="h-4 w-4 text-cyan-400" />
                Student Portal
              </Button>
            </Link>
            <Link href="/teacher/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="glass" className="w-full justify-center gap-2 text-purple-300 border-purple-500/40">
                <BookOpenCheck className="h-4 w-4 text-purple-400" />
                Teacher Portal
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
