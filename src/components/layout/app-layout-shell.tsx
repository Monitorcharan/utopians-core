import type { ReactNode } from "react";

export function AppLayoutShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased">{children}</div>;
}
