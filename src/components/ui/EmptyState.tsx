// src/components/ui/EmptyState.tsx
import type { LucideIcon } from "lucide-react";
import { PackageOpen } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-alpha-400 px-6 py-14 text-center",
        className,
      )}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700">
        <Icon size={22} />
      </div>
      <p className="text-sm font-semibold text-gray-1000">{title}</p>
      {description && (
        <p className="max-w-sm text-xs text-gray-700">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
