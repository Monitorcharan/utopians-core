"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ToggleSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
  description?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  activeColor?: "indigo" | "emerald";
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  isLoading = false,
  label,
  description,
  className,
  size = "md",
  activeColor = "indigo",
}) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  const handleToggle = () => {
    if (disabled || isLoading) return;
    onChange(!checked);
  };

  // Dimensions based on size
  const dimensions = {
    sm: {
      track: "w-9 h-5",
      thumb: "h-3.5 w-3.5",
      translate: "translate-x-4",
    },
    md: {
      track: "w-12 h-6.5",
      thumb: "h-5 w-5",
      translate: "translate-x-5.5",
    },
    lg: {
      track: "w-14 h-7.5",
      thumb: "h-6 w-6",
      translate: "translate-x-6.5",
    },
  }[size];

  // Active color classes
  const activeColorClasses =
    activeColor === "emerald"
      ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_16px_rgba(16,185,129,0.4)]"
      : "bg-gradient-to-r from-indigo-600 to-emerald-500 shadow-[0_0_18px_rgba(99,102,241,0.4)]";

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || "Toggle availability"}
        disabled={disabled || isLoading}
        onClick={handleToggle}
        className={cn(
          "relative inline-flex flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-all duration-300 ease-in-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          dimensions.track,
          checked ? activeColorClasses : "bg-slate-700/80 hover:bg-slate-600/80",
          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-flex items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-out",
            dimensions.thumb,
            checked ? dimensions.translate : "translate-x-0"
          )}
        >
          {isLoading && (
            <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          )}
        </span>
      </button>

      {(label || description) && (
        <label htmlFor={switchId} className="flex flex-col cursor-pointer" onClick={handleToggle}>
          {label && (
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                checked ? "text-white" : "text-slate-300"
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-slate-400 leading-normal">{description}</span>
          )}
        </label>
      )}
    </div>
  );
};

export default ToggleSwitch;
