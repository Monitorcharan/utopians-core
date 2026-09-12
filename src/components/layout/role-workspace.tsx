"use client";

import type { ReactNode } from "react";
import { useAuthContext } from "@/context/auth-context";
import { DashboardShell } from "./DashboardShell";
import type { UserRole } from "@/types";

export function RoleWorkspace({ role, activeItem, children }: { role: UserRole; activeItem: string; children: ReactNode }) {
  const { user, profile } = useAuthContext();
  return <DashboardShell role={role} activeItem={activeItem} userProfile={profile ? {
    id: profile.id, fullName: profile.full_name, username: profile.username,
    email: user?.email, skills: profile.skills,
  } : null}>{children}</DashboardShell>;
}
