"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types/database";

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfileForUser = useCallback(
    async (authUser: User): Promise<Profile | null> => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (error || !data) {
          console.warn(
            "Authenticated user has no profile record. Signing out per security policy.",
            error?.message
          );
          // If no profile exists, log the user out and redirect to home
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          router.replace("/?error=profile_not_found");
          return null;
        }

        const validProfile = data as Profile;
        setProfile(validProfile);
        return validProfile;
      } catch (err) {
        console.error("Error fetching user profile:", err);
        return null;
      }
    },
    [supabase, router]
  );

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user) return null;
    return await fetchProfileForUser(user);
  }, [user, fetchProfileForUser]);

  const signOut = useCallback(async () => {
    try {
      if (user?.id && profile?.role === "teacher") {
        await supabase
          .from("profiles")
          .update({ is_online: false })
          .eq("id", user.id);
      }
    } catch (err) {
      console.warn("Could not mark teacher offline before sign out:", err);
    }

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setUser(null);
      setProfile(null);
      router.push("/");
      router.refresh();
    }
  }, [user, profile, supabase, router]);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (currentUser) {
          setUser(currentUser);
          await fetchProfileForUser(currentUser);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      } else if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        setUser(session.user);
        await fetchProfileForUser(session.user);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfileForUser]);

  const value: AuthContextValue = {
    user,
    profile,
    role: profile?.role ?? null,
    isLoading,
    isAuthenticated: !!user && !!profile,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
