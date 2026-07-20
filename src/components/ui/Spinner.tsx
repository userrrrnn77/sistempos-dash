// src/components/ui/Spinner.tsx
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SpinnerProps {
  size?: number;
  className?: string;
  /** Label untuk screen reader. */
  label?: string;
}

export function Spinner({
  size = 20,
  className,
  label = "Memuat",
}: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center">
      <Loader2
        size={size}
        className={cn("animate-spin text-gray-700", className)}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Full-page/full-container centered spinner, dipakai saat menunggu data awal halaman. */
export function PageSpinner({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex min-h-60 w-full flex-col items-center justify-center gap-3">
      <Spinner size={28} />
      <p className="text-sm text-gray-700">{label}</p>
    </div>
  );
}
