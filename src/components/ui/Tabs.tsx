// src/components/ui/Tabs.tsx
import { cn } from "../../utils/cn";

export interface TabItem {
  label: string;
  value: string;
  /** Angka kecil di sebelah label, mis. jumlah item. */
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1",
        className,
      )}>
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background-100 text-gray-1000 shadow-raised"
                : "text-gray-700 hover:text-gray-1000",
            )}>
            {item.label}
            {typeof item.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  isActive
                    ? "bg-gray-200 text-gray-900"
                    : "bg-gray-200 text-gray-700",
                )}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
