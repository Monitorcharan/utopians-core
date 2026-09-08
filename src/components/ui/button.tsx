import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger" | "secondary" | "glass";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // 0.75rem border radius standard (rounded-xl)
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer";

    const variantStyles: Record<string, string> = {
      primary:
        "bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-md hover:shadow-indigo-500/20 shadow-xs shadow-indigo-200 active:bg-indigo-700",
      outline:
        "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm active:bg-slate-100 shadow-2xs",
      ghost:
        "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60",
      danger:
        "bg-red-500 text-white hover:bg-red-600 hover:shadow-md hover:shadow-red-500/20 shadow-xs shadow-red-200 active:bg-red-700",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200/80 hover:shadow-sm active:bg-slate-200 shadow-2xs",
      glass:
        "bg-white/70 backdrop-blur-md border border-slate-200/80 text-slate-800 hover:bg-white hover:shadow-sm shadow-xs",
    };

    const sizeStyles = {
      sm: "text-xs px-3.5 py-1.5 h-8 gap-1.5",
      md: "text-sm px-4.5 py-2 h-10 gap-2",
      lg: "text-base px-6 py-2.5 h-12 gap-2.5",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant] || variantStyles.primary,
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2 shrink-0" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
