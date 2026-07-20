// src/components/ui/Switch.tsx
import { useId } from "react";
import { cn } from "../../utils/cn";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  className,
}: SwitchProps) {
  const id = useId();

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-blue-700" : "bg-gray-400",
        )}>
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.75",
          )}
        />
      </button>
      {label && (
        <label htmlFor={id} className="text-sm text-gray-1000 select-none">
          {label}
        </label>
      )}
    </div>
  );
}
