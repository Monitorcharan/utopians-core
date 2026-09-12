"use client";

import React, { useEffect, useState, useRef } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import {
  Upload,
  Camera,
  Tag,
  X,
  Plus,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

const POPULAR_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Python",
  "Node.js",
  "Tailwind CSS",
  "SQL",
  "Algorithms",
  "System Design",
  "Calculus",
  "Physics",
];

export default function TeacherProfileSettingsPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Load teacher profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;
        setEmail(user.email || "");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          const p = profileData as Profile;
          setProfile(p);
          setFullName(p.full_name || "");
          setBio(p.bio || "");
          setSkills(p.skills || []);
          setAvatarUrl(p.avatar_url || null);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  // Handle Avatar Upload via Supabase Storage
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validate size (max 5MB) and format
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image size exceeds 5MB limit. Please choose a smaller image.");
      return;
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

    setIsUploadingAvatar(true);
    try {
      // 1. Upload to Supabase Storage 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload avatar");
      }

      // 2. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // 3. Immediately save avatar_url to profiles table
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      showToast("success", "Profile picture updated successfully!");
    } catch (err: unknown) {
      console.error("Avatar upload error:", err);
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      showToast("error", msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Skill tag management
  const handleAddSkill = (skillToAdd?: string) => {
    const skill = (skillToAdd || newSkillInput).trim();
    if (!skill) return;

    if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      showToast("error", "This skill is already in your list.");
      return;
    }

    setSkills((prev) => [...prev, skill]);
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Save changes to profiles table
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsSaving(true);
    try {
      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          skills: skills,
          avatar_url: avatarUrl,
        })
        .eq("id", profile.id);

      if (updateError) {
        throw new Error(updateError.message || "Failed to update profile");
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: fullName.trim() || null,
              bio: bio.trim() || null,
              skills: skills,
              avatar_url: avatarUrl,
            }
          : null
      );

      showToast("success", "Profile updated successfully!");
    } catch (err: unknown) {
      console.error("Error saving profile:", err);
      const msg = err instanceof Error ? err.message : "Failed to save profile changes";
      showToast("error", msg);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (fullName || profile?.username || "Instructor")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (isLoading) {
    return (
      <DashboardShell role="teacher" activeItem="profile">
        <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="text-xs font-mono text-slate-500">Loading profile settings...</span>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      role="teacher"
      userProfile={{
        id: profile?.id,
        fullName: profile?.full_name,
        username: profile?.username,
        email: email,
        role: "teacher",
        isOnline: profile?.is_online,
        skills: profile?.skills,
        avatarUrl: avatarUrl,
      }}
      activeItem="profile"
    >
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header with View Public Profile CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Instructor Profile Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Customize your bio, skills, and profile photo visible to prospective students.
            </p>
          </div>


        </div>

        <form onSubmit={handleSaveChanges} className="space-y-8">
          {/* 1. AVATAR UPLOAD SECTION */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="h-4 w-4 text-indigo-600" />
              <span>Profile Picture</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div className="relative group shrink-0">
                {avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-24 w-24 rounded-3xl object-cover border-2 border-indigo-100 shadow-sm"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-2xl shadow-sm border-2 border-indigo-100">
                    {initials}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white border border-slate-200 shadow-md text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
                  title="Upload image"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-500" />
                  <span>{isUploadingAvatar ? "Uploading..." : "Upload New Photo"}</span>
                </button>
                <p className="text-[11px] text-slate-400">
                  Recommended: Square JPG, PNG, or WebP. Max size: 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* 2. BASIC DETAILS & BIO */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>Bio & General Information</span>
            </h2>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Display Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Jane Smith"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-sans"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Short Bio</label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {bio.length}/600 characters
                </span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={600}
                rows={4}
                placeholder="Describe your background, teaching philosophy, and what students will learn with you..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-sans resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* 3. SKILLS & EXPERTISE */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Tag className="h-4 w-4 text-indigo-600" />
              <span>Skills & Subjects</span>
            </h2>

            {/* Tag Input */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700">
                Add Topics (Press Enter or comma to add)
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={handleKeyDownSkill}
                  placeholder="e.g. Next.js, Algorithms, Linear Algebra..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Add
                </button>
              </div>

              {/* Selected Skills Chips */}
              <div className="flex flex-wrap gap-2 pt-2 min-h-10">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs group"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-indigo-400 hover:text-indigo-700 transition-colors cursor-pointer"
                      title="Remove skill"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {skills.length === 0 && (
                  <span className="text-xs text-slate-400 italic">
                    No skills added yet. Choose from suggestions below or type your own.
                  </span>
                )}
              </div>

              {/* Suggestions */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                  Popular Suggestions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.filter(
                    (s) => !skills.some((existing) => existing.toLowerCase() === s.toLowerCase())
                  ).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
