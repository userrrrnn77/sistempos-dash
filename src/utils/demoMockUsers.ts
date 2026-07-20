// src/utils/demoMockUsers.ts
import type { DemoRole, InternalUser } from "../types/auth";
import { DEMO_ROLE_TO_INTERNAL_ROLE } from "../types/auth";

/**
 * 🎭 Mock user internal per role, dipakai HANYA saat Mode Demo aktif
 * (?demo=true&role=...). Tidak pernah menyentuh Supabase / backend asli.
 */
const DEMO_USERS: Record<DemoRole, InternalUser> = {
  developer: {
    id: "demo-developer-id",
    supabaseId: "demo-supabase-developer",
    name: "Dev Demo (Sudo Mode)",
    email: "developer.demo@sistempos.app",
    role: DEMO_ROLE_TO_INTERNAL_ROLE.developer,
    status: "active",
    joinedAt: new Date("2024-01-10").toISOString(),
  },
  owner: {
    id: "demo-owner-id",
    supabaseId: "demo-supabase-owner",
    name: "Owner Demo",
    email: "owner.demo@sistempos.app",
    role: DEMO_ROLE_TO_INTERNAL_ROLE.owner,
    status: "active",
    joinedAt: new Date("2024-02-14").toISOString(),
  },
  cashier: {
    id: "demo-cashier-id",
    supabaseId: "demo-supabase-cashier",
    name: "Kasir Demo",
    email: "cashier.demo@sistempos.app",
    role: DEMO_ROLE_TO_INTERNAL_ROLE.cashier,
    // Kasir asli selalu terkunci ke satu cabang — demo perlu nilai dummy ini
    // biar PosPage (yang sekarang scope ke user.branchId) tetap bisa render.
    branchId: "demo-branch-id", // Object literal may only specify known properties, and 'branchId' does not exist in type 'InternalUser'.
    status: "active",
    joinedAt: new Date("2024-03-20").toISOString(),
  },
};

export function getDemoUser(role: DemoRole): InternalUser {
  return DEMO_USERS[role];
}
