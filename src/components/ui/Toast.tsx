import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "../../utils/cn";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; iconClass: string; borderClass: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-green-700",
    borderClass: "border-green-500",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-700",
    borderClass: "border-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-700",
    borderClass: "border-amber-500",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-700",
    borderClass: "border-blue-500",
  },
};

const AUTO_DISMISS_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...toast, id }]);

      window.setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {createPortal(
        <div className="fixed inset-x-0 bottom-0 z-200 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end">
          {toasts.map((toast) => {
            const config = VARIANT_CONFIG[toast.variant];
            const Icon = config.icon;
            return (
              <div
                key={toast.id}
                role="status"
                className={cn(
                  "flex w-full max-w-sm items-start gap-2.5 rounded-lg border bg-background-100 px-4 py-3 shadow-menu",
                  config.borderClass,
                )}
              >
                <Icon size={18} className={cn("mt-0.5 shrink-0", config.iconClass)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-1000">
                    {toast.title}
                  </p>
                  {toast.description && (
                    <p className="mt-0.5 text-xs text-gray-700">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Tutup notifikasi"
                  className="shrink-0 rounded p-0.5 text-gray-700 hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast harus dipakai di dalam <ToastProvider>, Bre!");
  }
  return ctx;
}