// src/components/Navbar.tsx
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Menu } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Switch } from "./ui/Switch";

/**
 * Peta path -> label breadcrumb yang enak dibaca.
 * Cukup tambah entry baru di sini setiap kali ada halaman baru.
 */
const PATH_LABELS: Record<string, string> = {
  dashboard: "Overview",
  pos: "Kasir / POS",
  products: "Produk",
  employees: "Karyawan",
  branches: "Cabang",
  transactions: "Transaksi",
  history: "Riwayat Pesanan",
  audit: "Audit Harian",
  "audit-log": "Audit Log",
};

function humanizeSegment(segment: string): string {
  if (PATH_LABELS[segment]) return PATH_LABELS[segment];
  // Fallback: kemungkinan besar segment ini adalah MongoDB ObjectId (detail page)
  return "Detail";
}

interface NavbarProps {
  /** Override judul halaman kalau breadcrumb otomatis kurang pas (mis. detail page). */
  title?: string;
  /** Dipanggil saat tombol hamburger mobile diklik, buka drawer Sidebar. */
  onOpenMobileMenu?: () => void;
}

export function Navbar({ title, onOpenMobileMenu }: NavbarProps) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const segments = location.pathname.split("/").filter(Boolean); // ["dashboard", "employees", ...]
  const crumbs = segments.map((segment, index) => ({
    label: humanizeSegment(segment),
    path: `/${segments.slice(0, index + 1).join("/")}`,
  }));

  const pageTitle = title ?? crumbs[crumbs.length - 1]?.label ?? "Overview";

  return (
    <>
      {/* --- Mobile top bar: hamburger + page title (breadcrumb disembunyikan, terlalu sempit) + theme switch --- */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-gray-alpha-400 bg-background-100/80 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="shrink-0 rounded-md p-1.5 text-gray-800 hover:bg-gray-100"
            aria-label="Buka menu">
            <Menu size={20} />
          </button>
          <h1 className="truncate text-sm font-semibold text-gray-1000">
            {pageTitle}
          </h1>
        </div>
        <Switch checked={isDark} onChange={toggleTheme} className="shrink-0" />
      </header>

      {/* --- Desktop top bar: full breadcrumb + page title + theme switch --- */}
      <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-gray-alpha-400 bg-background-100/80 px-6 py-3.5 backdrop-blur lg:flex">
        <div>
          <h1 className="text-base font-semibold text-gray-1000">
            {pageTitle}
          </h1>
          <nav aria-label="Breadcrumb" className="mt-0.5">
            <ol className="flex items-center gap-1 text-xs text-gray-700">
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                  <li key={crumb.path} className="flex items-center gap-1">
                    {index > 0 && (
                      <ChevronRight size={12} className="text-gray-600" />
                    )}
                    {isLast ? (
                      <span className="text-gray-800">{crumb.label}</span>
                    ) : (
                      <Link
                        to={crumb.path}
                        className="transition-colors hover:text-gray-1000">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <Switch
          checked={isDark}
          onChange={toggleTheme}
          label={isDark ? "Dark" : "Light"}
        />
      </header>
    </>
  );
}
