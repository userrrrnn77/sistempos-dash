// src/components/ui/Alert.tsx
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "../../utils/cn";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertProps {
  variant?: AlertVariant;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}

const VARIANT_CONFIG: Record<
  AlertVariant,
  { icon: typeof Info; bg: string; border: string; title: string; body: string }
> = {
  info: {
    icon: Info,
    bg: "bg-blue-100",
    border: "border-blue-400",
    title: "text-blue-1000",
    body: "text-blue-900",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-green-100",
    border: "border-green-400",
    title: "text-green-1000",
    body: "text-green-900",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-100",
    border: "border-amber-400",
    title: "text-amber-1000",
    body: "text-amber-900",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-100",
    border: "border-red-400",
    title: "text-red-1000",
    body: "text-red-900",
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: AlertProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3",
        config.bg,
        config.border,
        className,
      )}>
      <Icon size={18} className={cn("mt-0.5 shrink-0", config.title)} />
      <div className="min-w-0">
        <p className={cn("text-sm font-semibold", config.title)}>{title}</p>
        {children && (
          <div className={cn("mt-0.5 text-xs leading-relaxed", config.body)}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
