// src/types/auth.ts

/**
 * 👑 Kasta Role User Internal (RBAC)
 * Harus selalu sinkron dengan enum di backend: src/types/auth.ts (InternalRole)
 */
export type InternalRole = "DEVELOPER" | "OWNER" | "CASHIER";

export type UserStatus = "active" | "inactive" | "suspended";

/**
 * Bentuk user internal (kolektor MongoDB `UserInternal`) yang dipakai FE.
 * Field opsional karena beberapa response (mis. hasil sync awal) bisa parsial.
 */
export interface InternalUser {
  id: string;
  /** Peninggalan era Supabase Auth, sudah tidak dipakai untuk login. */
  supabaseId?: string;
  name: string;
  email: string;
  role: InternalRole;
  /** Cabang tempat kasir ditugaskan. Cuma relevan untuk role CASHIER. */
  branchId?: string;
  status: UserStatus;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Role yang valid untuk query param ?role= di Mode Demo.
 * Sengaja subset dari InternalRole (huruf kecil di URL demi UX link yang lebih enak dibaca).
 */
export type DemoRole = "developer" | "owner" | "cashier";

export const DEMO_ROLE_TO_INTERNAL_ROLE: Record<DemoRole, InternalRole> = {
  developer: "DEVELOPER",
  owner: "OWNER",
  cashier: "CASHIER",
};

export function isDemoRole(value: string | null): value is DemoRole {
  return value === "developer" || value === "owner" || value === "cashier";
}