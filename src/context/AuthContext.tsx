// src/context/AuthContext.tsx
import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import api from "../services/api";
import { supabase, type OAuthProvider } from "../services/supabaseClient";
import type { DemoRole, InternalRole, InternalUser } from "../types/auth";
import { DEMO_ROLE_TO_INTERNAL_ROLE, isDemoRole } from "../types/auth";
import { getDemoUser } from "../utils/demoMockUsers";

const TOKEN_STORAGE_KEY = "token";

interface AuthContextValue {
  /** User internal yang sedang login (asli ATAU mock demo). Null kalau belum login & bukan demo. */
  user: InternalUser | null;
  /** Role user saat ini. Null kalau belum ada user. Shortcut biar gak perlu `user?.role` di mana-mana. */
  role: InternalRole | null;
  /** Session Supabase asli. Selalu null saat Mode Demo aktif. */
  session: Session | null;
  /** True selama proses cek session awal / sync profile berjalan. */
  isLoading: boolean;
  /** True kalau sudah ada user (asli maupun demo) yang siap dipakai render dashboard. */
  isAuthenticated: boolean;
  /**
   * Pesan error kalau session Supabase valid TAPI sync ke backend internal gagal
   * (mis. server 500, network error). Beda dari "belum login" — ini dipakai UI
   * (mis. Login page) buat kasih tau user apa yang salah, bukan diam-diam redirect.
   */
  authError: string | null;

  // --- Demo Mode ---
  /** True jika `?demo=true` terdeteksi di URL. Mengunci seluruh app ke mode read-only. */
  isDemoMode: boolean;
  /** Role yang dipilih di URL demo (`?role=cashier|owner|developer`). Null kalau bukan demo. */
  demoRole: DemoRole | null;

  // --- Actions ---
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
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

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<InternalUser | null>(
    isDemoMode && demoRole ? getDemoUser(demoRole) : null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(!isDemoMode);
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * Supabase bisa nembak `getSession()` (bootstrap) DAN `onAuthStateChange`
   * (event INITIAL_SESSION/SIGNED_IN/TOKEN_REFRESHED) untuk session yang SAMA,
   * hampir bersamaan — apalagi di React StrictMode yang sengaja re-run effect.
   * Tanpa guard ini, syncInternalProfile bisa nembak 2-3x paralel dan bikin
   * request belakangan nabrak unique index `supabaseId` di backend (race condition).
   * Ref ini nyimpen promise yang lagi berjalan per supabaseId, biar request
   * kedua (dst) numpang nunggu hasil yang pertama alih-alih bikin request baru.
   */
  const syncInFlightRef = useRef<{
    supabaseId: string;
    promise: Promise<void>;
  } | null>(null);

  /**
   * Sinkronkan profile Supabase -> backend internal (MongoDB), lalu simpan user internal-nya.
   * Dipanggil setelah session Supabase berhasil didapat (login baru maupun restore session).
   */
  const syncInternalProfile = useCallback(async (activeSession: Session) => {
    const { user: supaUser } = activeSession;

    // Kalau ada sync yang lagi jalan untuk supabaseId yang sama, numpang aja hasilnya
    // daripada nembak request baru yang bakal nabrak duplicate key di backend.
    if (syncInFlightRef.current?.supabaseId === supaUser.id) {
      return syncInFlightRef.current.promise;
    }

    const promise = (async () => {
      try {
        const { data } = await api.post("/auth/internal/sync", {
          supabaseId: supaUser.id,
          email: supaUser.email,
          name:
            (supaUser.user_metadata?.full_name as string | undefined) ??
            (supaUser.user_metadata?.name as string | undefined) ??
            supaUser.email,
        });

        setUser(data.user as InternalUser);
        setAuthError(null);
      } catch (err) {
        console.error("[SistemPOS] Gagal sync profile internal:", err);
        setUser(null);
        setAuthError(
          "Gagal menyinkronkan akun ke server. Coba muat ulang halaman, Bre.",
        );
      } finally {
        // Bersihin slot in-flight cuma kalau masih nunjuk ke request ini,
        // biar gak ke-clear duluan oleh sync lain yang start lebih baru.
        if (syncInFlightRef.current?.supabaseId === supaUser.id) {
          syncInFlightRef.current = null;
        }
      }
    })();

    syncInFlightRef.current = { supabaseId: supaUser.id, promise };
    return promise;
  }, []);

  // --- Bootstrap: cek session Supabase yang ada saat app pertama kali dibuka ---
  useEffect(() => {
    // Mode Demo aktif -> skip total proses Supabase, user sudah di-mock dari initial state.
    if (isDemoMode) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;

      setSession(data.session);

      if (data.session) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.session.access_token);
        await syncInternalProfile(data.session);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
      }

      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);

        if (newSession) {
          localStorage.setItem(TOKEN_STORAGE_KEY, newSession.access_token);
          await syncInternalProfile(newSession);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setUser(null);
        }
      },
    );

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [isDemoMode, syncInternalProfile]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      if (isDemoMode) return; // Mode Demo tidak pernah butuh login beneran

      setAuthError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    },
    [isDemoMode],
  );

  const loginWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      if (isDemoMode) return;

      setAuthError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    },
    [isDemoMode],
  );

  const logout = useCallback(async () => {
    if (isDemoMode) return; // Tidak ada session beneran untuk di-logout-kan

    await supabase.auth.signOut();
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setSession(null);
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
      session,
      isLoading,
      isAuthenticated: Boolean(user),
      authError,
      isDemoMode,
      demoRole,
      loginWithEmail,
      loginWithOAuth,
      logout,
      hasRole,
      guardMutation,
    }),
    [
      user,
      session,
      isLoading,
      authError,
      isDemoMode,
      demoRole,
      loginWithEmail,
      loginWithOAuth,
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
