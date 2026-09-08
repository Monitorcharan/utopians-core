"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

export interface AuthProfile {
  id: string;
  role: UserRole;
  username: string;
  full_name: string | null;
  is_online: boolean;
}

/**
 * Custom hook that fetches the current user's profile and enforces role-based redirects.
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
  const supabase = createClient();

  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) {
            setIsAuthenticated(false);
            setProfile(null);
            setIsLoading(false);
          }
          return;
        }

        // User is authenticated
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, role, username, full_name, is_online")
          .eq("id", user.id)
          .single();

        if (!cancelled) {
          setIsAuthenticated(true);

          if (profileData) {
            setProfile(profileData as AuthProfile);

            const dashboardPath =
              profileData.role === "teacher"
                ? "/teacher/dashboard"
                : "/student/dashboard";

            // If user is on a login/signup page and already authenticated, redirect them
            if (redirectIfAuthenticated) {
              router.replace(dashboardPath);
              return;
            }

            // If user is on a protected page but has the wrong role, redirect
            if (expectedRole && profileData.role !== expectedRole) {
              router.replace(dashboardPath);
              return;
            }
          }

          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    check();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { profile, isLoading, isAuthenticated };
}
