"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/auth-context";
import type { UserRole, Profile } from "@/types/database";

export type AuthProfile = Profile;

/**
 * Custom hook that consumes the central AuthContext and enforces role-based redirects.
 *
 * @param expectedRole - If set, redirect the user to the correct dashboard
 *                       when their profile role doesn't match.
 * @param redirectIfAuthenticated - If true, redirect already-authenticated
 *                                  users to their dashboard (useful on login/signup pages).
 */
export function useAuth(options?: {
  expectedRole?: UserRole;
  redirectIfAuthenticated?: boolean;
}) {
  const { expectedRole, redirectIfAuthenticated = false } = options ?? {};
  const router = useRouter();
  const { user, profile, role, isLoading, isAuthenticated, signOut, refreshProfile } =
    useAuthContext();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && profile) {
      const dashboardPath =
        profile.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";

      // If user is on a login/signup page and already authenticated, redirect them
      if (redirectIfAuthenticated) {
        router.replace(dashboardPath);
        return;
      }

      // If user is on a protected page but has the wrong role, redirect
      if (expectedRole && profile.role !== expectedRole) {
        router.replace(dashboardPath);
        return;
      }
    }
  }, [isAuthenticated, profile, expectedRole, redirectIfAuthenticated, isLoading, router]);

  return {
    user,
    profile,
    role,
    isLoading,
    isAuthenticated,
    signOut,
    refreshProfile,
  };
}

