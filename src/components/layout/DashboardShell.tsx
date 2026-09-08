"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Zap,
  Compass,
  BookOpen,
  History,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Video,
  Sparkles,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export interface DashboardShellProps {
  role: "student" | "teacher";
  userProfile?: {
    id?: string;
    fullName?: string | null;
    username?: string;
    email?: string;
    role?: string;
    avatarUrl?: string | null;
    isOnline?: boolean;
    skills?: string[];
  } | null;
  activeItem?: string;
  onProfileClick?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  userProfile,
  activeItem,
  onProfileClick,
  headerActions,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (userProfile?.id && role === "teacher") {
        await supabase
          .from("profiles")
          .update({ is_online: false })
          .eq("id", userProfile.id);
      }
    } catch (e) {
      console.error("Error setting offline on logout:", e);
    }
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Define sidebar navigation items based on role
  const studentNavItems = [
    {
      id: "discover",
      label: "Discover",
      href: "/student/discover",
      icon: Compass,
      description: "Find online mentors",
    },
    {
      id: "sessions",
      label: "My Sessions",
      href: "/student/dashboard",
      icon: BookOpen,
      description: "Upcoming & active rooms",
    },
    {
      id: "history",
      label: "History",
      href: "/student/history",
      icon: History,
      description: "Past sessions & reviews",
    },
  ];

  const teacherNavItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/teacher/dashboard",
      icon: LayoutDashboard,
      description: "Command center & stats",
    },
    {
      id: "availability",
      label: "Availability",
      href: "/teacher/availability",
      icon: CalendarDays,
      description: "Manage booking slots",
    },
    {
      id: "history",
      label: "History",
      href: "/teacher/history",
      icon: History,
      description: "Teaching logs & ratings",
    },
  ];

  const navItems = role === "teacher" ? teacherNavItems : studentNavItems;

  const displayName =
    userProfile?.fullName || userProfile?.username || (role === "teacher" ? "Instructor" : "Student");
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleOpenProfile = () => {
    if (onProfileClick) {
      onProfileClick();
    } else if (role === "teacher") {
      router.push("/teacher/profile/settings");
    } else {
      setIsProfileModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30 bg-white border-r border-slate-200/80 shadow-xs">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-base tracking-tight leading-none">
                Utopians<span className="text-indigo-600">Core</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                {role === "teacher" ? "Teacher Portal" : "Student Hub"}
              </span>
            </div>
          </Link>
          <Badge
            variant={role === "teacher" ? "indigo" : "slate"}
            className="text-[10px] uppercase font-mono px-2 py-0.5"
          >
            {role}
          </Badge>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent =
              activeItem === item.id ||
              (item.href !== "#" &&
                item.href.length > 2 &&
                !item.href.includes("#") &&
                pathname === item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isCurrent
                    ? "bg-indigo-50 text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${
                      isCurrent
                        ? "text-indigo-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isCurrent && (
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                )}
              </Link>
            );
          })}

          {/* Profile Item */}
          {role === "teacher" ? (
            <Link
              href="/teacher/profile/settings"
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeItem === "profile" || pathname === "/teacher/profile/settings"
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <User
                  className={`h-4.5 w-4.5 transition-colors ${
                    activeItem === "profile" || pathname === "/teacher/profile/settings"
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>Profile</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleOpenProfile}
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeItem === "profile"
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <User
                  className={`h-4.5 w-4.5 transition-colors ${
                    activeItem === "profile"
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>Profile</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>

        {/* Public Landing Link & Help */}
        <div className="px-4 py-3 border-t border-slate-100">
          <Link
            href={role === "teacher" ? "/for-teachers" : "/for-students"}
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>{role === "teacher" ? "Teacher Benefits" : "Student Guide"}</span>
            </span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </Link>
        </div>

        {/* Bottom User Card in Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={handleOpenProfile}
              className="flex items-center gap-3 min-w-0 cursor-pointer group"
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 font-bold text-white text-xs shadow-2xs group-hover:ring-2 group-hover:ring-indigo-400/30 transition-all">
                {initials}
                {userProfile?.isOnline !== undefined && (
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                      userProfile.isOnline ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {userProfile?.email || (role === "teacher" ? "Verified Mentor" : "Learner")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE SLIDE-OVER DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Zap className="h-4 w-4 fill-current" />
                </div>
                <span className="font-bold text-slate-900 text-base">
                  Utopians<span className="text-indigo-600">Core</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isCurrent =
                  activeItem === item.id ||
                  (item.href !== "#" && pathname === item.href);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isCurrent
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 text-indigo-600" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenProfile();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 text-left"
              >
                <User className="h-4.5 w-4.5 text-indigo-600" />
                <span>Profile</span>
              </button>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              aria-label="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                {role === "teacher" ? "Teacher Portal" : "Student Hub"}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-sm font-bold text-slate-800 capitalize">
                {activeItem || (role === "teacher" ? "Command Center" : "Home")}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {headerActions}

            {/* User Avatar Chip */}
            <button
              type="button"
              onClick={handleOpenProfile}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-2xs transition-all cursor-pointer group"
            >
              <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {initials}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden md:inline group-hover:text-indigo-600">
                {displayName}
              </span>
            </button>

            {/* Header Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/60 transition-all text-xs font-semibold cursor-pointer shadow-2xs"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>

      {/* ================= BUILT-IN PROFILE MODAL ================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Your Profile</h3>
                  <p className="text-xs text-slate-500">Account overview & credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xl flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">{displayName}</h4>
                    <Badge variant={role === "teacher" ? "indigo" : "emerald"} className="text-[10px] uppercase">
                      {role}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{userProfile?.email || "No email on record"}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                    Active Account
                  </p>
                </div>
              </div>

              {userProfile?.skills && userProfile.skills.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    {role === "teacher" ? "Teaching Specialties" : "Learning Interests"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {userProfile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign Out
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsProfileModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardShell;
