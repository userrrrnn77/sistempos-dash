// src/components/RoleBadge.tsx
import type { InternalRole } from "../types/auth";

interface RoleBadgeProps {
  role: InternalRole;
  className?: string;
}

const ROLE_STYLES: Record<InternalRole, string> = {
  DEVELOPER: "bg-purple-300 text-purple-1000 border border-purple-500",
  OWNER: "bg-blue-300 text-blue-1000 border border-blue-500",
  CASHIER: "bg-green-300 text-green-1000 border border-green-500",
};

const ROLE_LABELS: Record<InternalRole, string> = {
  DEVELOPER: "Developer",
  OWNER: "Owner",
  CASHIER: "Cashier",
};

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[role]} ${className}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
