"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MarivanLogoProps {
  className?: string;
  variant?: "full" | "icon" | "white" | "dark";
  size?: "sm" | "md" | "lg";
}

export function MarivanLogo({ className, variant = "full", size = "md" }: MarivanLogoProps) {
  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm sm:text-base",
    lg: "text-lg sm:text-xl",
  };

  const subSizes = {
    sm: "text-[9px]",
    md: "text-xs",
    lg: "text-xs sm:text-sm",
  };

  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      {/* Brand Vector Emblem (Anchor + Shield + Waves) */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 text-white shadow-md border border-blue-500/30 p-1.5",
          iconSizes[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full text-white"
        >
          {/* Shield Contour */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="stroke-blue-400/40 fill-blue-600/20" />
          {/* Anchor & Maritime Symbol */}
          <circle cx="12" cy="8" r="2" />
          <line x1="12" y1="10" x2="12" y2="17" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <path d="M8 15a4 4 0 0 0 8 0" />
        </svg>
      </div>

      {/* Brand Typography */}
      {variant !== "icon" && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-black tracking-tight uppercase font-mono",
                variant === "white" ? "text-white" : "text-slate-900",
                textSizes[size]
              )}
            >
              MARIVAN
            </span>
            <span
              className={cn(
                "font-bold tracking-widest text-blue-600 uppercase text-[10px] sm:text-xs bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded",
                variant === "white" && "bg-blue-500/20 text-blue-300 border-blue-400/30"
              )}
            >
              LOGISTICS
            </span>
          </div>
          <span
            className={cn(
              "font-medium tracking-wide truncate",
              variant === "white" ? "text-slate-300" : "text-slate-500",
              subSizes[size]
            )}
          >
            Operador Logístico Perú
          </span>
        </div>
      )}
    </div>
  );
}
