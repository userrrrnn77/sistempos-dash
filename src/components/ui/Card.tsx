// src/components/ui/Card.tsx
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-alpha-400 bg-background-100 shadow-raised",
        className,
      )}
      {...props}
    />
  );
}

interface CardHeaderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  // Fix: HTMLAttributes<HTMLDivElement> punya `title?: string` bawaan (tooltip attribute),
  // sedangkan kita mau `title` menerima ReactNode (judul header, bisa berupa JSX).
  // Solusinya: Omit dulu `title` bawaan HTML sebelum override dengan tipe ReactNode di bawah.
  title?: ReactNode;
  description?: ReactNode;
  /** Slot kanan header, biasanya Button atau menu aksi. */
  action?: ReactNode;
}

export function CardHeader({
  className,
  title,
  description,
  action,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-gray-alpha-400 px-5 py-4",
        className,
      )}
      {...props}>
      <div className="min-w-0">
        {title && (
          <h3 className="text-sm font-semibold text-gray-1000">{title}</h3>
        )}
        {description && (
          <p className="mt-0.5 text-xs text-gray-700">{description}</p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-gray-alpha-400 px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}
