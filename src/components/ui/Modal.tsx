import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  // Tutup dengan Escape, dan kunci scroll body selama modal terbuka.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-alpha-800"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-background-100 shadow-modal sm:rounded-2xl",
          SIZE_CLASS[size],
        )}>
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 border-b border-gray-alpha-400 px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h2
                  id="modal-title"
                  className="text-sm font-semibold text-gray-1000">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-xs text-gray-700">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="shrink-0 rounded-md p-1.5 text-gray-700 transition-colors hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="overflow-y-auto scrollbar-thin px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-alpha-400 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
