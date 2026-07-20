// src/components/ui/Badge.tsx
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export type BadgeTone =
  | "gray"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "teal";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** Titik indikator kecil di kiri teks (dot status, mis. online/offline). */
  dot?: boolean;
  className?: string;
}

const TONE_STYLES: Record<BadgeTone, string> = {
  gray: "bg-gray-200 text-gray-900",
  blue: "bg-blue-200 text-blue-900",
  green: "bg-green-200 text-green-900",
  amber: "bg-amber-200 text-amber-900",
  red: "bg-red-200 text-red-900",
  purple: "bg-purple-200 text-purple-900",
  teal: "bg-teal-200 text-teal-900",
};

const DOT_STYLES: Record<BadgeTone, string> = {
  gray: "bg-gray-700",
  blue: "bg-blue-700",
  green: "bg-green-700",
  amber: "bg-amber-700",
  red: "bg-red-700",
  purple: "bg-purple-700",
  teal: "bg-teal-700",
};

export function Badge({ children, tone = "gray", dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_STYLES[tone],
        className,
      )}>
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[tone])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
