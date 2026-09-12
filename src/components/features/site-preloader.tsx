"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { BrandWordmark } from "@/components/ui/brand-loader";

type Phase = "loading" | "exiting" | "done";
const INTRO_KEY = "utopians-intro-seen";
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function rememberIntro() {
  try { sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* Storage is optional. */ }
}

export function SitePreloader({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    if (!hydrated || phase !== "loading") return;
    let active = true;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let seen = false;
    try { seen = sessionStorage.getItem(INTRO_KEY) === "1"; } catch { /* Continue without storage. */ }
    const skip = () => { if (active) { rememberIntro(); setPhase("done"); } };
    // Returning to a live session should never wait for a brand introduction.
    if (seen || preference.matches || window.location.pathname.startsWith("/session/")) {
      queueMicrotask(skip);
      return () => { active = false; };
    }
    const startedAt = performance.now();
    const beginExit = () => {
      if (!active) return;
      rememberIntro();
      setPhase("exiting");
    };
    const ready = () => {
      Promise.resolve(document.fonts?.ready).then(() => {
        if (active) exitTimer = setTimeout(beginExit, Math.max(0, 2200 - (performance.now() - startedAt)));
      });
    };
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") skip(); };
    if (document.readyState === "complete") ready();
    else window.addEventListener("load", ready, { once: true });
    preference.addEventListener("change", skip);
    document.addEventListener("keydown", keydown);
    const safetyTimer = setTimeout(beginExit, 5000);
    return () => {
      active = false;
      clearTimeout(exitTimer);
      clearTimeout(safetyTimer);
      window.removeEventListener("load", ready);
      preference.removeEventListener("change", skip);
      document.removeEventListener("keydown", keydown);
    };
  }, [hydrated, phase]);

  useEffect(() => {
    if (phase !== "exiting") return;
    const timer = setTimeout(() => setPhase("done"), 850);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!hydrated || phase === "done") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [hydrated, phase]);

  function dismiss() { rememberIntro(); setPhase("done"); }

  return (
    <>
      {hydrated && phase !== "done" && (
        <div className="preloader" data-phase={phase}>
          <div className="preloader-stage" role="status" aria-label="Welcome to Utopians Core">
            <BrandWordmark loop />
            <span className="preloader-core" aria-hidden="true">CORE</span>
            <p className="preloader-tagline">A little connection. A lot of possibility.</p>
          </div>
          <button className="preloader-skip" onClick={dismiss}>Skip intro <span aria-hidden="true">↗</span></button>
        </div>
      )}
      <div className="site-content" data-state={hydrated ? phase : "done"} onFocusCapture={phase !== "done" ? dismiss : undefined}>
        {children}
      </div>
    </>
  );
}
