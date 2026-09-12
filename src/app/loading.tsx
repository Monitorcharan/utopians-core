import { Loader2 } from "lucide-react";

export default function Loading() {
  return <div role="status" className="min-h-[70vh] flex items-center justify-center gap-3 text-sm text-slate-500"><Loader2 size={20} className="animate-spin" />Loading your page...</div>;
}
