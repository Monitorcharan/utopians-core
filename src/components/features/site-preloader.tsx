"use client";

import { useEffect, useState, type ReactNode } from "react";

type Phase = "loading" | "exiting" | "done";

const MIN_VISIBLE_MS = 1700;
const MAX_VISIBLE_MS = 5000;
const EXIT_DURATION_MS = 1250;

const WORDS: { text: string; tone: "ink" | "accent" }[] = [
  { text: "utopians", tone: "ink" },
  { text: "core", tone: "accent" },
];

function waitForWindowLoad() {
  return new Promise<void>((resolve) => {
    if (document.readyState === "complete") return resolve();
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

export function SitePreloader({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    const startedAt = performance.now();
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const beginExit = () => {
      if (cancelled) return;
      cancelled = true;
      setPhase("exiting");
    };

    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    Promise.all([fontsReady, waitForWindowLoad()]).then(() => {
      const elapsed = performance.now() - startedAt;
      exitTimer = setTimeout(beginExit, Math.max(0, MIN_VISIBLE_MS - elapsed));
    });

    const safetyTimer = setTimeout(beginExit, MAX_VISIBLE_MS);

    return () => {
      cancelled = true;
      clearTimeout(exitTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (phase !== "exiting") return;
    const timer = setTimeout(() => setPhase("done"), EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "done") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase]);

  let letterIndex = 0;

  return (
    <>
      {phase !== "done" && (
        <div
          className="preloader"
          data-phase={phase}
          role="status"
          aria-live="polite"
          aria-label="Utopians Core is loading"
        >
          <div className="preloader-stage">
            <div className="preloader-word" aria-hidden="true">
              {WORDS.map((word, wordIdx) => (
                <span key={word.text} className="preloader-segment" data-tone={word.tone}>
                  {wordIdx > 0 && <span className="preloader-space" />}
                  {word.text.split("").map((char, charIdx) => {
                    const i = letterIndex++;
                    return (
                      <span key={`${word.text}-${charIdx}`} className="preloader-letter">
                        <span style={{ "--i": i } as React.CSSProperties}>{char}</span>
                      </span>
                    );
                  })}
                </span>
              ))}
            </div>
            <div className="preloader-bar">
              <span className="preloader-bar-fill" />
            </div>
            <p className="preloader-tagline">Learn anything. Instantly.</p>
          </div>
        </div>
      )}
      <div className="site-content" data-state={phase}>
        {children}
      </div>
    </>
  );
}
