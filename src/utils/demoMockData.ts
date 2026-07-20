// src/utils/demoMockData.ts
import type { Branch, DailyIncomeSummary, Employee } from "../types/api";

/**
 * True kalau Mode Demo aktif (`?demo=true` di URL). Dipakai di banyak tempat
 * (services, api.ts interceptor) makanya dipusatkan di sini biar gak duplikat.
 */
export function isDemoModeActive(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "true";
}

/**
 * 🎭 Data dummy khusus Mode Demo.
 *
 * Kebijakan per domain data selama Mode Demo aktif:
 * - Products, Categories           -> tetap hit API asli (GET-nya memang public di backend).
 * - Branches                       -> endpoint /branches di backend diproteksi authenticate,
 *   jadi di-mock juga biar gak 401 (gak ada token Supabase asli di Mode Demo).
 * - Transactions & Audit Log       -> DISEMBUNYIKAN total, gak hit API asli sama sekali.
 * - Employees (UserInternal)       -> DISEMBUNYIKAN dari data asli, tapi tetap kasih
 *   dummy data biar UI (halaman Karyawan) tetap kelihatan bentuknya buat demo.
 *
 * ID branch di sini ("000000000000000000000001", "000000000000000000000002") sengaja disamakan
 * dengan yang direferensikan di demoMockUsers.ts (Kasir Demo) dan DEMO_EMPLOYEES
 * di bawah, biar cross-reference (mis. badge cabang kasir) tetap nyambung.
 */

export const DEMO_BRANCHES: Branch[] = [
  {
    _id: "000000000000000000000001",
    name: "Cabang Utama (Demo)",
    code: "DEMO-01",
    address: "Jl. Demo Raya No. 1",
    phone: "021-0000001",
    isActive: true,
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date("2024-01-15").toISOString(),
  },
  {
    _id: "000000000000000000000002",
    name: "Cabang Kedua (Demo)",
    code: "DEMO-02",
    address: "Jl. Demo Kedua No. 2",
    phone: "021-0000002",
    isActive: true,
    createdAt: new Date("2024-04-01").toISOString(),
    updatedAt: new Date("2024-04-01").toISOString(),
  },
];

export const DEMO_EMPLOYEES: Employee[] = [
  {
    _id: "demo-employee-owner",
    supabaseId: "demo-supabase-owner",
    name: "Owner Demo",
    email: "owner.demo@sistempos.app",
    role: "OWNER",
    status: "active",
    joinedAt: new Date("2024-02-14").toISOString(),
  },
  {
    _id: "demo-employee-cashier-1",
    supabaseId: "demo-supabase-cashier-1",
    name: "Kasir Demo (Cabang Utama)",
    email: "cashier1.demo@sistempos.app",
    role: "CASHIER",
    branchId: "000000000000000000000001",
    status: "active",
    joinedAt: new Date("2024-03-20").toISOString(),
  },
  {
    _id: "demo-employee-cashier-2",
    supabaseId: "demo-supabase-cashier-2",
    name: "Kasir Demo (Cabang Kedua)",
    email: "cashier2.demo@sistempos.app",
    role: "CASHIER",
    branchId: "000000000000000000000002",
    status: "inactive",
    joinedAt: new Date("2024-05-02").toISOString(),
  },
];

export function getDemoDailyIncome(branchId?: string): DailyIncomeSummary {
  return {
    date: new Date().toISOString().split("T")[0],
    branchId: branchId || "ALL_BRANCHES",
    totalTransactions: 0,
    summary: {
      totalIncome: 0,
      cashAmount: 0,
      qrisAmount: 0,
      debitAmount: 0,
    },
  };
}
