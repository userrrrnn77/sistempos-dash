// src/components/Sidebar.tsx
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { LogOut, X, FlaskConical } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getVisibleMenuGroups } from "../config/menuConfig";
import { RoleBadge } from "./RoleBadge";
import { branchesService } from "../services/branches";
import type { DemoRole } from "../types/auth";

const DEMO_ROLE_LINKS: { role: DemoRole; label: string }[] = [
  { role: "cashier", label: "Cashier" },
  { role: "owner", label: "Owner" },
  { role: "developer", label: "Developer" },
];

function buildDemoRoleUrl(role: DemoRole): string {
  const params = new URLSearchParams(window.location.search);
  params.set("demo", "true");
  params.set("role", role);
  return `${window.location.pathname}?${params.toString()}`;
}

interface SidebarProps {
  /** State buka/tutup drawer mobile, dikontrol dari DashboardLayout (dipicu tombol hamburger di Navbar). */
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const { user, role, isDemoMode, demoRole, logout } = useAuth();
  const [currentBranchName, setCurrentBranchName] =
    useState<string>("Multi-Cabang Admin");

  useEffect(() => {
    // Jika user punya branchId khusus
    if (user?.branchId) {
      branchesService
        .getById(user.branchId)
        .then((branch) => setCurrentBranchName(branch.name))
        .catch(() => setCurrentBranchName("Semua Cabang"));
    } else if (role === "OWNER" || role === "DEVELOPER") {
      setCurrentBranchName("Pusat / All Branches");
    }
  }, [user?.branchId, role]);

  const visibleGroups = getVisibleMenuGroups(role);

  const handleLogout = async () => {
    if (isDemoMode) return; // Tidak ada session beneran di Mode Demo
    await logout();
  };

  return (
    <>
      {/* --- Overlay mobile --- */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-alpha-700 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-alpha-400 bg-background-100 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        {/* --- Brand header --- */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tertiary text-sm font-bold text-white">
              S
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-1000">SistemPOS</p>
              <p className="text-xs text-gray-700">{currentBranchName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1.5 text-gray-700 hover:bg-gray-100 lg:hidden"
            aria-label="Tutup menu">
            <X size={18} />
          </button>
        </div>

        {/* --- Demo Mode banner --- */}
        {isDemoMode && (
          <div className="mx-4 mb-3 rounded-lg border border-amber-500 bg-amber-100 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-amber-1000">
              <FlaskConical size={14} />
              <p className="text-xs font-semibold">Mode Demo Read-Only</p>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-amber-900">
              Semua aksi tambah/ubah/hapus dinonaktifkan.
            </p>

            <div className="mt-2 flex flex-wrap gap-1">
              {DEMO_ROLE_LINKS.map(({ role: linkRole, label }) => (
                <a
                  key={linkRole}
                  href={buildDemoRoleUrl(linkRole)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    demoRole === linkRole
                      ? "bg-amber-700 text-white"
                      : "bg-amber-200 text-amber-1000 hover:bg-amber-300"
                  }`}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* --- Navigation --- */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
          {visibleGroups.map((group, groupIndex) => (
            <div key={group.title ?? `group-${groupIndex}`} className="mb-4">
              {group.title && (
                <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-gray-700">
                  {group.title}
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === "/dashboard"}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-blue-200 text-blue-800"
                              : "text-gray-900 hover:bg-gray-100"
                          }`
                        }>
                        <Icon size={17} strokeWidth={2} />
                        {item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* --- Footer: user info + logout --- */}
        <div className="border-t border-gray-alpha-400 px-4 py-3">
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-900">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-1000">
                {user?.name ?? "Guest"}
              </p>
              {user?.role && <RoleBadge role={user.role} className="mt-0.5" />}
            </div>
          </div>

          {!isDemoMode && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100">
              <LogOut size={16} />
              Keluar
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
