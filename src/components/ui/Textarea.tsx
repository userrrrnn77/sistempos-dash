// src/components/ui/Textarea.tsx
import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const describedBy = error
      ? `${textareaId}-error`
      : helperText
        ? `${textareaId}-helper`
        : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-gray-1000">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            "w-full resize-y rounded-lg border bg-background-100 px-3 py-2 text-sm text-gray-1000 outline-none transition-colors",
            "placeholder:text-gray-700",
            "focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
            error
              ? "border-red-700 focus-visible:border-red-700 focus-visible:ring-red-400"
              : "border-gray-alpha-400",
            className,
          )}
          {...props}
        />

        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-red-700">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="text-xs text-gray-700">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
