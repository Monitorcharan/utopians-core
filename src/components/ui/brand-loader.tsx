"use client";

import { useSyncExternalStore } from "react";

function subscribeToMotion(onChange: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

const motionAllowed = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverMotion = () => false;

// Matching cubic segments let the letter itself become the symbol, without a crossfade.
const letters = {
  u: "M8 27 C8 32 8 37 8 42 C8 50 11 54 18 54 C22 54 25 52 28 49 C31 46 34 42 36 38 C36 34 36 30 36 27 C36 35 36 45 36 54",
  book: "M22 23 C16 18 9 17 3 18 C3 28 3 40 3 49 C10 48 17 50 22 55 C27 50 34 48 41 49 C41 40 41 28 41 18 C35 17 28 18 22 23",
  o: "M103 26 C93 26 88 32 88 40 C88 49 94 55 103 55 C112 55 119 49 119 40 C119 32 113 26 107 26 C105 26 104 26 103 26 Z",
  conversation: "M103 19 C91 19 84 26 84 35 C84 43 88 47 93 49 C93 51 92 56 90 59 C98 57 100 52 105 51 C130 51 129 19 103 19 Z",
  i: "M186 29 C186 31 186 33 186 35 C186 37 186 39 186 41 C186 43 186 45 186 47 C186 49 186 51 186 54",
  spark: "M186 17 C188 30 191 33 202 36 C191 39 188 42 186 55 C184 42 181 39 170 36 C181 33 184 30 186 17",
};

export function BrandWordmark({ loop = false }: { loop?: boolean }) {
  const animate = useSyncExternalStore(subscribeToMotion, motionAllowed, serverMotion);
  const timing = {
    dur: "3.6s", repeatCount: loop ? "indefinite" : "1", calcMode: "spline" as const,
    keyTimes: "0;0.14;0.4;0.6;0.88;1",
    keySplines: "0.22 1 0.36 1;0.65 0 0.25 1;0.22 1 0.36 1;0.65 0 0.25 1;0.22 1 0.36 1",
  };
  const morph = (letter: string, shape: string) => animate && (
    <animate attributeName="d" values={`${letter};${letter};${shape};${shape};${letter};${letter}`} {...timing} />
  );

  return (
    <svg className="brand-wordmark" viewBox="0 0 352 80" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <g className="brand-letter-accent">
        <path d={letters.u}>{morph(letters.u, letters.book)}</path>
        <path d="M22 24 V54" opacity="0">
          {animate && <animate attributeName="opacity" values="0;0;1;1;0;0" {...timing} />}
        </path>
      </g>
      <path d="M61 15 V44 Q61 57 74 53 M49 28 H73" />
      <g className="brand-letter-accent">
        <path d={letters.o}>{morph(letters.o, letters.conversation)}</path>
        <path d="M95 35 H110" strokeWidth="3" opacity="0">
          {animate && <animate attributeName="opacity" values="0;0;1;1;0;0" {...timing} />}
        </path>
      </g>
      <path d="M137 28 V69 M137 36 C145 18 165 24 165 40 C165 55 146 61 137 45" />
      <g className="brand-letter-accent">
        <path d={letters.i}>{morph(letters.i, letters.spark)}</path>
        <circle cx="186" cy="16" r="2.4" fill="currentColor" stroke="none">
          {animate && <animate attributeName="opacity" values="1;1;0;0;1;1" {...timing} />}
        </circle>
      </g>
      <path d="M238 28 V54 M238 37 C231 18 210 24 210 40 C210 56 230 61 238 44" />
      <path d="M256 28 V54 M256 37 C260 22 282 22 282 38 V54" />
      <path d="M325 29 C310 20 296 32 309 39 L319 42 C336 49 317 61 304 51" />
    </svg>
  );
}

export function BrandLoader({ label = "Getting your space ready", compact = false, portal }: {
  label?: string;
  compact?: boolean;
  portal?: "student" | "teacher";
}) {
  return (
    <div className={`brand-loader${compact ? " brand-loader-compact" : ""}`} data-portal={portal} role="status" aria-live="polite">
      <div className="brand-loader-art"><BrandWordmark loop /></div>
      <span className="brand-loader-core" aria-hidden="true">CORE</span>
      <p className="brand-loader-label">{label}<span className="brand-loader-dots" aria-hidden="true"><i /><i /><i /></span></p>
    </div>
  );
}
