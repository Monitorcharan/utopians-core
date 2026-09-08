import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "error"
    | "outline"
    | "cyan"
    | "emerald"
    | "purple"
    | "amber"
    | "slate"
    | "indigo"
    | "rose";
  size?: "sm" | "md";
  pulse?: boolean;
  onRemove?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "primary",
  size = "md",
  pulse = false,
  onRemove,
  children,
  ...props
}) => {
  // Design system color palette:
  // Primary (indigo-600), Secondary (gray-100), Accent (emerald-500), Error (red-500)
  const variantStyles: Record<string, string> = {
    primary: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    error: "bg-red-50 text-red-700 border-red-200/80",
    rose: "bg-rose-50 text-rose-700 border-rose-200/80",
    outline: "border border-slate-300 text-slate-700 bg-transparent",

    // Backward compatibility variants
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <div
      className={cn(
        // 0.75rem (rounded-xl) consistent border radius
        "inline-flex items-center rounded-lg border font-medium tracking-normal select-none transition-colors shadow-2xs",
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}

      <span>{children}</span>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-sm p-0.5 opacity-60 hover:opacity-100 hover:bg-black/5 transition-all cursor-pointer"
          aria-label="Remove badge"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

Badge.displayName = "Badge";
export default Badge;
