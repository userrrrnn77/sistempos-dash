// src/components/ui/Select.tsx
import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  /** Teks placeholder di opsi paling atas (disabled, value kosong). */
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, helperText, options, placeholder, id, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const describedBy = error
      ? `${selectId}-error`
      : helperText
        ? `${selectId}-helper`
        : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-gray-1000">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "h-10 w-full appearance-none rounded-lg border bg-background-100 px-3 pr-9 text-sm text-gray-1000 outline-none transition-colors",
              "focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
              error
                ? "border-red-700 focus-visible:border-red-700 focus-visible:ring-red-400"
                : "border-gray-alpha-400",
              className,
            )}
            {...props}>
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 text-gray-700"
          />
        </div>

        {error && (
          <p id={`${selectId}-error`} className="text-xs text-red-700">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${selectId}-helper`} className="text-xs text-gray-700">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
