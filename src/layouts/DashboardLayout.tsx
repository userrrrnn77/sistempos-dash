// src/layouts/DashboardLayout.tsx
import { useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { PageSpinner } from "../components/ui/Spinner";
import type { InternalRole } from "../types/auth";

interface DashboardLayoutProps {
  /**
   * Kalau diisi, hanya role yang tercantum yang boleh melihat SEMUA halaman di bawah layout ini.
   * Untuk proteksi per-halaman (bukan per-grup), pakai <RequireRole> di dalam elemen page-nya.
   */
  roles?: InternalRole[];
}

export function DashboardLayout({ roles }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();
  // Dikontrol di sini (bukan di dalam Sidebar) karena trigger-nya sekarang ada
  // di Navbar (tombol hamburger mobile) — dua komponen beda butuh state yang sama.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background-100">
        <PageSpinner label="Menyiapkan dashboard..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && role && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-dvh bg-background-100">
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * Gerbang proteksi role di level halaman tunggal (dipakai di dalam route yang sama-sama
 * bisa diakses banyak role, tapi satu halaman spesifik harus lebih ketat).
 * Contoh: /dashboard/products bisa diakses semua role, tapi tombol create ada guard-nya sendiri di UI.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: InternalRole[];
  children: ReactNode;
}) {
  const { role } = useAuth();

  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
