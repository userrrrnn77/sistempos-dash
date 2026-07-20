// src/context/AuthContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api from "../services/api";
import type { DemoRole, InternalRole, InternalUser } from "../types/auth";
import { DEMO_ROLE_TO_INTERNAL_ROLE, isDemoRole } from "../types/auth";
import { getDemoUser } from "../utils/demoMockUsers";
import { extractErrorMessage } from "../hooks/useFetch";

const TOKEN_STORAGE_KEY = "token";

interface AuthContextValue {
  /** User internal yang sedang login (asli ATAU mock demo). Null kalau belum login & bukan demo. */
  user: InternalUser | null;
  /** Role user saat ini. Null kalau belum ada user. Shortcut biar gak perlu `user?.role` di mana-mana. */
  role: InternalRole | null;
  /** True selama proses cek token awal / login berjalan. */
  isLoading: boolean;
  /** True kalau sudah ada user (asli maupun demo) yang siap dipakai render dashboard. */
  isAuthenticated: boolean;
  /**
   * Pesan error kalau ada masalah auth di luar aksi lokal (mis. token expired
   * pas bootstrap). Beda dari "belum login" — ini dipakai UI (mis. Login page)
   * buat kasih tau user apa yang salah, bukan diam-diam redirect.
   */
  authError: string | null;

  // --- Demo Mode ---
  /** True jika `?demo=true` terdeteksi di URL. Mengunci seluruh app ke mode read-only. */
  isDemoMode: boolean;
  /** Role yang dipilih di URL demo (`?role=cashier|owner|developer`). Null kalau bukan demo. */
  demoRole: DemoRole | null;

  // --- Actions ---
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Helper RBAC: cek apakah role user saat ini termasuk salah satu dari `roles`. */
  hasRole: (...roles: InternalRole[]) => boolean;
  /**
   * Gerbang wajib sebelum melakukan aksi mutasi (create/update/delete).
   * Return `true` jika aksi BOLEH diteruskan, `false` jika ditolak (dan sudah menampilkan alert).
   * Pasang ini di awal setiap handler submit/hapus/aksi destruktif.
   */
  guardMutation: () => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readDemoParamsFromLocation(): {
  isDemoMode: boolean;
  demoRole: DemoRole | null;
} {
  if (typeof window === "undefined") {
    return { isDemoMode: false, demoRole: null };
  }

  const params = new URLSearchParams(window.location.search);
  const demoFlag = params.get("demo") === "true";
  const roleParam = params.get("role");

  if (!demoFlag) {
    return { isDemoMode: false, demoRole: null };
  }

  // Demo aktif tapi role tidak valid/tidak diisi -> fallback ke cashier (paling terbatas, paling aman).
  const demoRole: DemoRole = isDemoRole(roleParam) ? roleParam : "cashier";

  return { isDemoMode: true, demoRole };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ isDemoMode, demoRole }] = useState(readDemoParamsFromLocation);

  const [user, setUser] = useState<InternalUser | null>(
    isDemoMode && demoRole ? getDemoUser(demoRole) : null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(!isDemoMode);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- Bootstrap: cek token JWT yang tersimpan saat app pertama kali dibuka ---
  useEffect(() => {
    // Mode Demo aktif -> skip total proses auth beneran, user sudah di-mock dari initial state.
    if (isDemoMode) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get("/auth/internal/me")
      .then(({ data }) => {
        if (!isMounted) return;
        setUser(data.data as InternalUser);
        setAuthError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        // Token invalid/expired -> bersihin, jangan tampilkan authError buat kasus
        // ini (bukan kegagalan tak terduga, ini memang "belum/gak lagi login").
        console.error("[SistemPOS] Gagal validasi token internal:", err);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isDemoMode]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      if (isDemoMode) return; // Mode Demo tidak pernah butuh login beneran

      setAuthError(null);
      try {
        const { data } = await api.post("/auth/internal/login", {
          email,
          password,
        });

        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setUser(data.user as InternalUser);
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    [isDemoMode],
  );

  const logout = useCallback(() => {
    if (isDemoMode) return; // Tidak ada session beneran untuk di-logout-kan

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  }, [isDemoMode]);

  const hasRole = useCallback(
    (...roles: InternalRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  /**
   * Benteng Demo Mode.
   * Panggil di awal setiap handler yang melakukan mutasi (submit form, hapus data, cetak struk, dsb).
   * Kalau demo aktif: cegat aksinya + munculkan alert, dan return false supaya handler berhenti.
   */
  const guardMutation = useCallback(() => {
    if (isDemoMode) {
      window.alert(
        "Aksi Ditolak! Anda sedang berada dalam Mode Demo Read-Only.",
      );
      return false;
    }
    return true;
  }, [isDemoMode]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isLoading,
      isAuthenticated: Boolean(user),
      authError,
      isDemoMode,
      demoRole,
      loginWithEmail,
      logout,
      hasRole,
      guardMutation,
    }),
    [
      user,
      isLoading,
      authError,
      isDemoMode,
      demoRole,
      loginWithEmail,
      logout,
      hasRole,
      guardMutation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>, Bre!");
  }
  return ctx;
}

export { DEMO_ROLE_TO_INTERNAL_ROLE };
export type { InternalRole, DemoRole, InternalUser };
