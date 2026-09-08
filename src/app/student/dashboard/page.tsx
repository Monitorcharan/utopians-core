"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  LogOut,
  Sparkles,
  BookOpen,
  Terminal,
  Activity,
  Plus,
  X,
  Clock,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isSavingSkill, setIsSavingSkill] = useState(false);

  useEffect(() => {
    async function loadStudentData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // No active session, redirect to login
          router.push("/student/login");
          return;
        }

        setEmail(user.email || "");

        // Fetch student profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setSkills(profileData.skills || []);
        } else {
          // Fallback if profile not created yet
          const fallbackProfile: Profile = {
            id: user.id,
            username:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Student",
            full_name: user.user_metadata?.full_name || null,
            avatar_url: null,
            role: "student",
            is_online: true,
            skills: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(fallbackProfile);
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudentData();
  }, [router, supabase]);

  const handleSignOut = async () => {
    if (profile) {
      await supabase
        .from("profiles")
        .update({ is_online: false })
        .eq("id", profile.id);
    }
    await supabase.auth.signOut();
    router.push("/student/login");
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || !profile) return;

    const updated = [...skills, newSkill.trim()];
    setSkills(updated);
    setNewSkill("");
    setIsSavingSkill(true);

    try {
      await supabase
        .from("profiles")
        .update({ skills: updated })
        .eq("id", profile.id);
    } catch (err) {
      console.error("Failed to save skill:", err);
    } finally {
      setIsSavingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!profile) return;
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);

    try {
      await supabase
        .from("profiles")
        .update({ skills: updated })
        .eq("id", profile.id);
    } catch (err) {
      console.error("Failed to remove skill:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <span className="text-xs text-slate-400 font-mono">
          Loading student node environment...
        </span>
      </div>
    );
  }

  return (
    <div className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-black shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Welcome, {profile?.username || "Student"}
                </h1>
                <Badge variant="cyan" className="font-mono text-xs uppercase">
                  {profile?.role || "student"}
                </Badge>
                <Badge variant="emerald" pulse className="font-mono text-xs">
                  Online
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
                {email} &bull; Node ID: 0x{profile?.id.slice(0, 8)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/student/history">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-slate-300 hover:text-white hover:border-slate-600"
              >
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Session History</span>
              </Button>
            </Link>

            <Link href="/student/discover">
              <Button
                variant="primary"
                size="sm"
                className="gap-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Find Online Teachers</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 text-slate-300 hover:text-red-400 hover:border-red-500/50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Grid: Stats & Learning Track */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-slate-950/60 border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Assigned Tier</span>
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">Novice Node</div>
          <div className="text-xs text-slate-400 mt-1">Tier 1 Autonomous Swarm</div>
        </Card>

        <Card className="bg-slate-950/60 border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Interactive Labs</span>
            <BookOpen className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">4 Modules Ready</div>
          <div className="text-xs text-slate-400 mt-1">Neural Mesh &amp; Consensus</div>
        </Card>

        <Card className="bg-slate-950/60 border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Wasm Terminal</span>
            <Terminal className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">Active Sandbox</div>
          <div className="text-xs text-slate-400 mt-1">Rust / AssemblyScript runtime</div>
        </Card>

        <Card className="bg-slate-950/60 border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Skills Logged</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{skills.length} Skills</div>
          <div className="text-xs text-slate-400 mt-1">Stored in Supabase database</div>
        </Card>
      </div>

      {/* Student Skills & Curriculum Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Skills Management */}
        <Card glow className="bg-slate-950/80 border-slate-800 p-6 space-y-6">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              Student Skills &amp; Proficiencies
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Add technical skills to your decentralized identity.
            </CardDescription>
          </div>

          {/* Add skill form */}
          <form onSubmit={handleAddSkill} className="flex gap-2">
            <Input
              placeholder="e.g. Next.js, Rust, Solidity"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              disabled={isSavingSkill}
              className="h-9 text-xs"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSavingSkill || !newSkill.trim()}
              className="px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          {/* Skills tags */}
          <div className="flex flex-wrap gap-2 pt-1 min-h-[60px]">
            {skills.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No skills added yet. Type a skill above to save to your profile.
              </p>
            ) : (
              skills.map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-1.5 rounded-md bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-200"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-500 hover:text-red-400 transition-colors ml-0.5"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column: Available Curriculum Tracks */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            Recommended Student Tracks
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-slate-950/60 border-slate-800 p-5 hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                  Lab 101
                </span>
                <Clock className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Neural Mesh Autonomous Nodes
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Learn how to spawn and orchestrate multi-agent microVM workers using the Utopians toolchain.
              </p>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500">Duration: 45m</span>
                <Link
                  href="/#modules"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  Start Lab <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>

            <Card className="bg-slate-950/60 border-slate-800 p-5 hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Lab 102
                </span>
                <Clock className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Post-Quantum State Cryptography
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Construct lattice-based cryptographic signatures and verify Merkle root consistency.
              </p>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500">Duration: 1h 15m</span>
                <Link
                  href="/#architecture"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  Start Lab <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
