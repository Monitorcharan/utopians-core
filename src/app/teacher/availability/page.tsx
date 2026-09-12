"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { createClient } from "@/lib/supabase/client";
import { AvailabilitySlot, Profile } from "@/types";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarDays,
} from "lucide-react";

export default function TeacherAvailabilityPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);

  // Form states
  const todayDateString = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayDateString);
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endTime, setEndTime] = useState<string>("11:00");

  // Notification / Toast
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Load teacher profile & slots
  const loadData = useCallback(async () => {
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
        setProfile(profileData as Profile);
      }

      // Fetch availability slots via API
      const res = await fetch("/api/availability");
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      }
    } catch (err) {
      console.error("Error loading availability data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadData]);

  // Quick preset helper
  const handleSelectPreset = (minutes: number) => {
    if (!startTime) return;
    const [hours, mins] = startTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, mins, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);

    const endH = String(date.getHours()).padStart(2, "0");
    const endM = String(date.getMinutes()).padStart(2, "0");
    setEndTime(`${endH}:${endM}`);
  };

  // Create slot handler
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !startTime || !endTime) {
      showToast("error", "Please fill in all date and time fields.");
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
    const endDateTime = new Date(`${selectedDate}T${endTime}:00`);
    const now = new Date();

    if (endDateTime <= startDateTime) {
      showToast("error", "End time must be after the start time.");
      return;
    }

    if (startDateTime < now) {
      showToast("error", "Cannot create an availability slot in the past.");
      return;
    }

    // Client-side overlap check
    const hasOverlap = slots.some((slot) => {
      const existingStart = new Date(slot.start_time);
      const existingEnd = new Date(slot.end_time);
      return startDateTime < existingEnd && endDateTime > existingStart;
    });

    if (hasOverlap) {
      showToast("error", "This slot overlaps with one of your existing slots.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create slot");
      }

      showToast("success", "Availability slot added successfully!");
      if (data.slot) {
        setSlots((prev) =>
          [...prev, data.slot].sort(
            (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          )
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add slot";
      showToast("error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete slot handler
  const handleDeleteSlot = async (slotId: string) => {
    setDeletingSlotId(slotId);
    try {
      const res = await fetch(`/api/availability?slotId=${slotId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete slot");
      }

      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      showToast("success", "Availability slot removed.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete slot";
      showToast("error", msg);
    } finally {
      setDeletingSlotId(null);
    }
  };

  const formatSlotDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatSlotTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateDurationMinutes = (startStr: string, endStr: string) => {
    const diff = new Date(endStr).getTime() - new Date(startStr).getTime();
    return Math.round(diff / 60000);
  };

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
        avatarUrl: profile?.avatar_url,
      }}
      activeItem="availability"
    >
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
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

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 px-3 py-1 text-xs font-semibold text-indigo-700 font-mono mb-2">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Mentorship Scheduling &bull; Advance Bookings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Manage Your Availability
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Set open hours so students can book planned 1-on-1 tutoring sessions in advance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/80 px-3.5 py-2 text-xs font-mono text-slate-600 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>
                {slots.filter((s) => !s.is_booked).length} Available Slot
                {slots.filter((s) => !s.is_booked).length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Form on Left, List on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Add Slot Form (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Add Availability Slot
                </h2>
                <p className="text-xs text-slate-500">
                  Open a future time window for student bookings
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4">
              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Date
                </label>
                <input
                  type="date"
                  min={todayDateString}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-sans"
                />
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Quick Duration Presets */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Quick Duration Presets
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(30)}
                    className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    30 min
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(45)}
                    className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    45 min
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(60)}
                    className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    60 min
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Save Availability Slot</span>
              </button>
            </form>
          </div>

          {/* RIGHT: Slots List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Existing Time Slots</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-mono">
                  {slots.length}
                </span>
              </h2>
            </div>

            {isLoading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="text-xs font-mono">Loading availability slots...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No time slots scheduled yet</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Use the form on the left to set up your open hours. Students will be able to book these directly from your public profile.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {slots.map((slot) => {
                  const duration = calculateDurationMinutes(slot.start_time, slot.end_time);
                  const isPast = new Date(slot.end_time) < new Date();
                  const isDeleting = deletingSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 bg-white ${
                        slot.is_booked
                          ? "border-indigo-200/80 bg-indigo-50/20"
                          : isPast
                          ? "border-slate-200 opacity-60"
                          : "border-slate-200/90 hover:border-indigo-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Date badge */}
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
                          <span className="text-[10px] uppercase font-bold text-indigo-600 font-mono">
                            {new Date(slot.start_time).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-base font-extrabold text-slate-900 leading-tight">
                            {new Date(slot.start_time).getDate()}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 tracking-tight">
                              {formatSlotTime(slot.start_time)} – {formatSlotTime(slot.end_time)}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              ({duration} min)
                            </span>

                            {/* Status Tag */}
                            {slot.is_booked ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 text-[10px] font-bold font-mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                                Booked
                              </span>
                            ) : isPast ? (
                              <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-mono">
                                Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2.5 py-0.5 text-[10px] font-bold font-mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Available
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500">
                            {formatSlotDate(slot.start_time)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0">
                        {!slot.is_booked ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id)}
                            disabled={isDeleting}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Delete Slot"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-indigo-600">
                            Session Confirmed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
