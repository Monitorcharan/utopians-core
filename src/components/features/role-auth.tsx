"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, Check, Eye, EyeOff, GraduationCap, Loader2, ShieldCheck, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/context/auth-context";
import type { UserRole } from "@/types";

const copy = {
  student: {
    label: "Student", eyebrow: "A LITTLE HELP. A BIG STEP FORWARD.",
    title: "Your next breakthrough starts here.",
    description: "A space to ask questions, build confidence, and keep learning at your own pace.",
    benefits: ["Find help with the topic on your mind", "Book a time that works for you", "Keep your sessions and progress together"],
    welcome: "Welcome back, learner.", signup: "Make room for something new.",
    subtitle: "Sign in to pick up where you left off.",
    step: "Your learning, in one place", preview: ["Explore a topic", "Plan your next session", "Keep making progress"],
  },
  teacher: {
    label: "Teacher", eyebrow: "YOUR KNOWLEDGE. YOUR SCHEDULE.",
    title: "Make space for meaningful teaching.",
    description: "A focused workspace for your expertise, your availability, and every session ahead.",
    benefits: ["Build a profile around your expertise", "Set availability on your own terms", "Manage requests and upcoming sessions"],
    welcome: "Welcome back, educator.", signup: "Start your teaching journey.",
    subtitle: "Sign in to your teaching workspace.",
    step: "A calmer teaching day", preview: ["Set your availability", "Manage session requests", "Share what you know"],
  },
};

export function RoleAuth({ role, mode = "login", callbackFailed = false }: { role: UserRole; mode?: "login" | "signup"; callbackFailed?: boolean }) {
  const content = copy[role];
  const signup = mode === "signup";
  const router = useRouter();
  const { isAuthenticated, role: currentRole, isLoading: checkingSession, refreshProfile } = useAuthContext();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const conflictingSession = isAuthenticated && currentRole !== role && !signedOut;
  const Icon = role === "student" ? GraduationCap : BookOpen;
  const callbackError = callbackFailed ? "We couldn’t sign you in to this portal. Please use an account registered here and try again." : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode, role, email: values.get("email"), password: values.get("password"),
          name: values.get("name"), username: values.get("username"), skills: values.get("skills"),
        }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not sign in. Please try again.");
      if (result.confirmationRequired) { setSuccess(true); return; }
      await refreshProfile();
      router.replace(`/${role}/dashboard`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  async function disconnect() {
    setBusy(true); setError("");
    const { error: authError } = await createClient().auth.signOut();
    if (authError) setError("Couldn’t sign out. Please try again.");
    else setSignedOut(true);
    setBusy(false);
  }

  return (
    <div className="portal-auth" data-portal={role}>
      <header className="portal-auth-header">
        <Link href={`/${role}/login`} className="portal-brand"><span className="portal-brand-icon"><Zap size={20} /></span>utopians<span className="portal-brand-light">core</span></Link>
        <span className="portal-label"><Icon size={15} />{content.label} portal</span>
      </header>
      <main className="portal-auth-main">
        <section className="portal-story" aria-label={`${content.label} portal introduction`}>
          <p className="portal-eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p className="portal-story-description">{content.description}</p>
          <ul className="portal-benefits">{content.benefits.map(item => <li key={item}><span><Check size={15} /></span>{item}</li>)}</ul>
          <div className="portal-preview">
            <div className="portal-preview-heading"><span className="portal-preview-icon"><CalendarDays size={20} /></span><div><span className="portal-eyebrow">A SIMPLE ROUTINE</span><h2>{content.step}</h2></div></div>
            {content.preview.map((item, index) => <div key={item} className="portal-preview-row"><span>0{index + 1}</span><p>{item}</p>{index === 0 ? <ArrowRight size={16} /> : <span className="portal-preview-dot" />}</div>)}
          </div>
          <p className="portal-story-footnote">One session at a time. A little further every day.</p>
        </section>
        <section className="portal-form-card" aria-label={`${content.label} ${mode}`}>
          <div className="portal-form-icon"><Icon size={24} /></div>
          <p className="portal-eyebrow">YOUR {content.label.toUpperCase()} ACCOUNT</p>
          <h2>{signup ? content.signup : content.welcome}</h2>
          <p className="portal-form-description">{signup ? `Create your ${content.label.toLowerCase()} account to get started.` : content.subtitle}</p>
          {checkingSession ? <div className="portal-session-loading" role="status"><Loader2 className="animate-spin" size={20} />Getting things ready…</div> : conflictingSession ? (
            <div className="portal-notice"><ShieldCheck size={22} /><h3>Use your {content.label.toLowerCase()} account</h3><p>Another account is signed in on this browser. Sign out to continue here.</p><button className="portal-primary" onClick={disconnect} disabled={busy}>Sign out and continue<ArrowRight size={16} /></button></div>
          ) : success ? (
            <div className="portal-notice" role="status"><Check size={24} /><h3>Check your inbox</h3><p>If this address is eligible, you’ll receive a confirmation email. Open it to finish setting up your account, then sign in here.</p><Link className="portal-primary" href={`/${role}/login`}>Back to sign in<ArrowRight size={16} /></Link></div>
          ) : (
            <>
              <form onSubmit={submit} className="portal-form mt-7">
                <fieldset disabled={busy}>
                  {signup && <><label htmlFor="name">Full name<input id="name" name="name" autoComplete="name" placeholder="Your full name" required maxLength={100} /></label><label htmlFor="username">Username<input id="username" name="username" autoComplete="username" placeholder="Choose a username" pattern="[a-zA-Z0-9_]{3,30}" title="3–30 letters, numbers, or underscores" required /></label></>}
                  <label htmlFor="email">Email address<input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
                  <label htmlFor="password">Password<span className="portal-password"><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "At least 8 characters" : "Enter your password"} minLength={signup ? 8 : undefined} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
                  {signup && role === "teacher" && <label htmlFor="skills">Your subjects <span className="portal-optional">(optional)</span><input id="skills" name="skills" placeholder="e.g. Mathematics, Python, Physics" /><span className="portal-field-help">Separate subjects with commas. You can edit these later.</span></label>}
                  {(error || callbackError) && <p className="portal-form-error" role="alert">{error || callbackError}</p>}
                  <button type="submit" className="portal-primary">{busy ? <Loader2 size={18} className="animate-spin" /> : <>{signup ? "Create my account" : "Sign in"}<ArrowRight size={17} /></>}</button>
                </fieldset>
              </form>
              <p className="portal-form-footer">{signup ? "Already have an account?" : "New here?"} <Link href={`/${role}/${signup ? "login" : "signup"}`}>{signup ? "Sign in" : "Create an account"}</Link></p>
            </>
          )}
          {conflictingSession && error && <p className="portal-form-error" role="alert">{error}</p>}
          <div className="portal-security"><ShieldCheck size={15} /><span>Your own space. Your own pace.</span></div>
        </section>
      </main>
      <footer className="portal-auth-footer"><span>Utopians Core · {content.label} portal</span><Link href={`/for-${role}s`}>About this space<ArrowRight size={13} /></Link></footer>
    </div>
  );
}
