// src/config/menuConfig.ts
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  Store,
  Receipt,
  ClipboardList,
  ShoppingCart,
  Tags,
  Truck,
  UserSearch,
} from "lucide-react";
import type { InternalRole } from "../types/auth";

export interface MenuItem {
  /** Label yang tampil di Sidebar. */
  label: string;
  /** Path route (react-router). */
  path: string;
  /** Icon dari lucide-react. */
  icon: LucideIcon;
  /**
   * Role yang boleh melihat menu ini.
   * Kosongkan / jangan isi array ini kalau menu boleh dilihat SEMUA role internal.
   */
  roles?: InternalRole[];
}

export interface MenuGroup {
  /** Judul grup, tampil sebagai section header kecil di Sidebar. Undefined = tanpa header. */
  title?: string;
  items: MenuItem[];
}

/**
 * 🗺️ Struktur menu Sidebar, dikelompokkan per section.
 * `roles` di tiap item HARUS selalu sinkron dengan middleware `authorize([...])`
 * di backend (src/routes/*.ts), supaya UI tidak menjanjikan akses yang ditolak backend.
 */
export const MENU_GROUPS: MenuGroup[] = [
  {
    items: [
      {
        label: "Overview",
        path: "/dashboard",
        icon: LayoutDashboard,
        // Semua role internal boleh lihat overview (kontennya sendiri yang beda per role)
      },
    ],
  },
  {
    title: "Operasional",
    items: [
      {
        label: "Kasir / POS",
        path: "/dashboard/pos",
        icon: ShoppingCart,
        roles: ["CASHIER", "OWNER", "DEVELOPER"],
      },
      {
        label: "Produk",
        path: "/dashboard/products",
        icon: Package,
        // GET /products bersifat publik, semua role internal boleh lihat.
        // Tombol tambah/hapus/edit info di dalam halaman baru dibatasi OWNER/DEVELOPER.
      },
      {
        label: "Kategori",
        path: "/dashboard/categories",
        icon: Tags,
        // GET /categories bersifat publik. Tombol create/edit/hapus dibatasi OWNER/DEVELOPER di dalam halaman.
      },
      {
        label: "Pesanan Online",
        path: "/dashboard/fulfillment",
        icon: Truck,
        roles: ["CASHIER", "OWNER", "DEVELOPER"],
      },
      {
        label: "Customer",
        path: "/dashboard/customers",
        icon: UserSearch,
        roles: ["CASHIER", "OWNER", "DEVELOPER"],
      },
    ],
  },
  {
    title: "Manajemen",
    items: [
      {
        label: "Karyawan",
        path: "/dashboard/employees",
        icon: Users,
        roles: ["OWNER", "DEVELOPER"],
      },
      {
        label: "Cabang",
        path: "/dashboard/branches",
        icon: Store,
        roles: ["OWNER", "DEVELOPER"],
      },
    ],
  },
  {
    title: "Transaksi",
    items: [
      {
        label: "Riwayat Pesanan",
        path: "/dashboard/transactions/history",
        icon: ArrowLeftRight,
        roles: ["CASHIER", "OWNER", "DEVELOPER"],
      },
      {
        label: "Audit Harian",
        path: "/dashboard/transactions/audit",
        icon: Receipt,
        roles: ["OWNER", "DEVELOPER"],
      },
    ],
  },
  {
    title: "Sudo Mode",
    items: [
      {
        label: "Audit Log",
        path: "/dashboard/audit-log",
        icon: ClipboardList,
        roles: ["DEVELOPER"],
      },
    ],
  },
];

/** Filter menu groups berdasarkan role aktif, buang group yang jadi kosong setelah difilter. */
export function getVisibleMenuGroups(role: InternalRole | null): MenuGroup[] {
  if (!role) return [];

  return MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || item.roles.includes(role),
    ),
  })).filter((group) => group.items.length > 0);
}
