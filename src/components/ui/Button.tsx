// src/components/ui/Button.tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Tampilkan spinner dan disable interaksi. */
  isLoading?: boolean;
  /** Icon di kiri teks (lucide-react component atau elemen apapun). */
  leftIcon?: ReactNode;
  /** Icon di kanan teks. */
  rightIcon?: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-background-100 hover:opacity-90 active:opacity-80 shadow-raised",
  secondary: "bg-gray-200 text-gray-1000 hover:bg-gray-300 active:bg-gray-400",
  outline:
    "border border-gray-alpha-400 text-gray-1000 bg-transparent hover:bg-gray-100 active:bg-gray-200",
  ghost: "bg-transparent text-gray-900 hover:bg-gray-100 active:bg-gray-200",
  destructive: "bg-red-700 text-white hover:bg-red-800 active:bg-red-900",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-lg",
  icon: "h-9 w-9 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-150",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          className,
        )}
        {...props}>
        {isLoading ? (
          <Loader2 className="animate-spin" size={size === "sm" ? 14 : 16} />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";
