// src/components/ui/Input.tsx
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Pesan error. Kalau terisi, border jadi merah dan pesan ini muncul di bawah field. */
  error?: string;
  /** Teks bantuan di bawah field, hanya tampil kalau tidak ada error. */
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, helperText, leftIcon, rightIcon, id, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = error
      ? `${inputId}-error`
      : helperText
        ? `${inputId}-helper`
        : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-1000">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 flex items-center text-gray-700">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "h-10 w-full rounded-lg border bg-background-100 px-3 text-sm text-gray-1000 outline-none transition-colors",
              "placeholder:text-gray-700",
              "focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
              error
                ? "border-red-700 focus-visible:border-red-700 focus-visible:ring-red-400"
                : "border-gray-alpha-400",
              leftIcon && "pl-9",

              //   Argument of type 'false | "" | 0 | 0n | "pl-9" | null | undefined' is not assignable to parameter of type 'ClassValue'.
              //   Type '0n' is not assignable to type 'ClassValue'.

              rightIcon && "pr-9",
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 flex items-center text-gray-700">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-700">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-gray-700">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
