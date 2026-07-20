// src/components/ui/StatCard.tsx
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../../utils/cn";

export interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Persentase perubahan dibanding periode sebelumnya. Positif = naik (hijau), negatif = turun (merah). */
  trend?: number;
  /** Label kecil di bawah trend, mis. "dari minggu lalu". */
  trendLabel?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
}: StatCardProps) {
  const isPositive = typeof trend === "number" && trend >= 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-alpha-400 bg-background-100 p-4 shadow-raised",
        className,
      )}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-800">
            <Icon size={16} />
          </div>
        )}
      </div>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-1000">
        {value}
      </p>

      {typeof trend === "number" && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              isPositive ? "text-green-800" : "text-red-800",
            )}>
            {isPositive ? (
              <ArrowUpRight size={13} />
            ) : (
              <ArrowDownRight size={13} />
            )}
            {Math.abs(trend)}%
          </span>
          {trendLabel && <span className="text-gray-700">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
