"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
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
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [state, setState] = useState<{ user: User | null; profile: Profile | null; isLoading: boolean; error: string | null }>({ user: null, profile: null, isLoading: true, error: null });
  const requestVersion = useRef({ value: 0 });
  const mounted = useRef(false);

  const synchronize = useCallback(async (quiet = false): Promise<Profile | null> => {
    const version = ++requestVersion.current.value;
    if (!quiet) setState(previous => ({ ...previous, isLoading: true, error: null }));
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        (async () => {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error && error.name !== "AuthSessionMissingError") throw error;
          if (!user) return { user: null, profile: null };
          const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (profileError || !profile) throw new Error("Your account profile could not be loaded. Please try again.");
          return { user, profile: profile as Profile };
        })(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("The connection timed out. Please try again.")), 15000); }),
      ]);
      if (mounted.current && version === requestVersion.current.value) setState({ ...result, isLoading: false, error: null });
      return result.profile;
    } catch (cause) {
      if (mounted.current && version === requestVersion.current.value) setState(previous => ({ ...previous, isLoading: false, error: cause instanceof Error ? cause.message : "Could not load your account." }));
      return null;
    } finally { clearTimeout(timer); }
  }, [supabase]);

  const refreshProfile = useCallback(() => synchronize(), [synchronize]);
  const signOut = useCallback(async () => {
    const destination = state.profile?.role === "teacher" ? "/teacher/login" : "/student/login";
    if (state.user && state.profile?.role === "teacher") await supabase.from("profiles").update({ is_online: false }).eq("id", state.user.id);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    ++requestVersion.current.value;
    setState({ user: null, profile: null, isLoading: false, error: null });
    router.replace(destination);
    router.refresh();
  }, [state.profile, state.user, supabase, router]);

  useEffect(() => {
    mounted.current = true;
    const requests = requestVersion.current;
    const initial = setTimeout(() => void synchronize(), 0);
    const pending = new Set<ReturnType<typeof setTimeout>>();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") {
        ++requestVersion.current.value;
        setState({ user: null, profile: null, isLoading: false, error: null });
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        // Never call another Supabase auth method while its callback lock is held.
        const timer = setTimeout(() => { pending.delete(timer); if (mounted.current) void synchronize(true); }, 0);
        pending.add(timer);
      }
    });
    return () => {
      mounted.current = false;
      ++requests.value;
      clearTimeout(initial);
      pending.forEach(clearTimeout);
      subscription.unsubscribe();
    };
  }, [supabase, synchronize]);

  return <AuthContext.Provider value={{ ...state, role: state.profile?.role ?? null, isAuthenticated: !!state.user && !!state.profile, signOut, refreshProfile }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within an AuthProvider");
  return context;
}
