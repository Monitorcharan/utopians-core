"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap, Compass, BookOpen, History, User, LogOut, Menu, X, LayoutDashboard, CalendarDays, ArrowUpRight, Loader2 } from "lucide-react";
import { useAuthContext } from "@/context/auth-context";
import { SessionUpdates } from "@/components/features/session-updates";
import { BrandLoader } from "@/components/ui/brand-loader";

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

export function DashboardShell({ role, userProfile, activeItem, onProfileClick, headerActions, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role: sessionRole, isLoading, isAuthenticated, error: authError, refreshProfile, signOut } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const profileDialog = useRef<HTMLDialogElement>(null);
  const navItems = role === "teacher" ? [
    { id: "dashboard", label: "Overview", href: "/teacher/dashboard", icon: LayoutDashboard },
    { id: "availability", label: "Availability", href: "/teacher/availability", icon: CalendarDays },
    { id: "history", label: "Session history", href: "/teacher/history", icon: History },
    { id: "profile", label: "Teaching profile", href: "/teacher/profile/settings", icon: User },
  ] : [
    { id: "sessions", label: "My learning", href: "/student/dashboard", icon: BookOpen },
    { id: "discover", label: "Find a mentor", href: "/student/discover", icon: Compass },
    { id: "history", label: "Session history", href: "/student/history", icon: History },
  ];
  const label = role === "teacher" ? "Teacher" : "Student";
  const name = userProfile?.fullName || userProfile?.username || "Your account";
  const initials = name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const currentPage = navItems.find(item => item.href === pathname || item.id === activeItem)?.label || "Your workspace";

  useEffect(() => {
    if (!isLoading && !authError && (!isAuthenticated || sessionRole !== role)) router.replace(`/${role}/login`);
  }, [isLoading, isAuthenticated, sessionRole, role, router, authError]);

  async function logout() {
    setLoggingOut(true); setLogoutError("");
    try { await signOut(); }
    catch { setLogoutError("Could not sign out. Please try again."); setLoggingOut(false); }
  }

  function openProfile() {
    if (onProfileClick) onProfileClick();
    else if (role === "teacher") router.push("/teacher/profile/settings");
    else profileDialog.current?.showModal();
  }

  if (authError) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center"><p role="alert" className="text-sm text-slate-600">{authError}</p><button className="portal-primary" onClick={() => void refreshProfile()}>Try again</button></div>;
  if (isLoading || !isAuthenticated || sessionRole !== role) return <BrandLoader portal={role} label="Opening your workspace" />;

  return (
    <div className="workspace" data-portal={role}>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/30" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className="workspace-sidebar" data-open={mobileOpen} aria-label={`${label} navigation`} onKeyDown={event => { if (event.key === "Escape") setMobileOpen(false); }}>
        <button className="workspace-mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={16} /></button>
        <Link href={`/${role}/dashboard`} className="portal-brand"><span className="portal-brand-icon"><Zap size={18} /></span>utopians<span className="portal-brand-light">core</span></Link>
        <span className="portal-label">{label} workspace</span>
        <p className="text-[10px] tracking-[.16em] text-slate-400 font-semibold px-3 mb-4">YOUR SPACE</p>
        <nav className="workspace-nav">
          {navItems.map(item => <Link key={item.id} href={item.href} onClick={() => setMobileOpen(false)} aria-current={pathname === item.href || activeItem === item.id ? "page" : undefined}><item.icon size={18} />{item.label}</Link>)}
          {role === "student" && <button onClick={() => { setMobileOpen(false); openProfile(); }}><User size={18} />My profile</button>}
        </nav>
        <Link className="workspace-support flex items-center justify-between" href={`/for-${role}s`}>{role === "teacher" ? "Teaching guide" : "Learning guide"}<ArrowUpRight size={14} /></Link>
        <div className="workspace-account">
          <button className="workspace-avatar" aria-label="Open your profile" onClick={openProfile}>{initials}</button>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold truncate">{name}</p><p className="text-[10px] text-slate-400 truncate mt-1">{label} account</p></div>
          <button aria-label="Sign out" title="Sign out" disabled={loggingOut} onClick={logout} className="p-2 text-slate-400 hover:text-rose-600">{loggingOut ? <Loader2 className="animate-spin" size={17} /> : <LogOut size={17} />}</button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <div className="flex items-center gap-3"><button className="workspace-mobile-toggle" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={18} /></button><div><p className="text-[10px] text-slate-400 mb-1">{label} workspace</p><p className="text-sm font-semibold">{currentPage}</p></div></div>
          <div className="flex items-center gap-3">{headerActions}<button className="workspace-avatar" aria-label="Open your profile" onClick={openProfile}>{initials}</button><button className="text-xs text-slate-500 p-2" aria-label="Sign out" disabled={loggingOut} onClick={logout}><LogOut size={17} /></button></div>
        </header>
        {logoutError && <p className="p-4 text-sm text-rose-600" role="alert">{logoutError}</p>}
        <main className="workspace-content"><SessionUpdates role={role} />{children}</main>
      </div>
      <dialog ref={profileDialog} className="m-auto w-[calc(100%-32px)] max-w-md rounded-2xl border border-slate-200 p-7 backdrop:bg-slate-950/35" onClick={event => { if (event.target === event.currentTarget) profileDialog.current?.close(); }}>
        <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold">My profile</h2><button aria-label="Close profile" onClick={() => profileDialog.current?.close()}><X size={19} /></button></div>
        <div className="flex items-center gap-4"><span className="workspace-avatar">{initials}</span><div><p className="font-semibold">{name}</p><p className="text-sm text-slate-500 mt-1">{userProfile?.email}</p></div></div>
        {!!userProfile?.skills?.length && <div className="mt-6"><h3 className="text-xs text-slate-500 mb-3">Learning interests</h3><div className="flex flex-wrap gap-2">{userProfile.skills.map(skill => <span key={skill} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs">{skill}</span>)}</div></div>}
        <button className="portal-primary mt-7 w-full" onClick={() => profileDialog.current?.close()}>Done</button>
      </dialog>
    </div>
  );
}

export default DashboardShell;
