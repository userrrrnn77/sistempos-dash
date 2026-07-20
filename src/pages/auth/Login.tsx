// src/pages/auth/Login.tsx
import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { OAuthProvider } from "../../services/supabaseClient";
import type { DemoRole } from "../../types/auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { ProviderIcon } from "../../components/ProviderIcon";
import { extractErrorMessage } from "../../hooks/useFetch";

const OAUTH_PROVIDERS: { provider: OAuthProvider; label: string }[] = [
  // { provider: "github", label: "Masuk dengan GitHub" },
  // { provider: "gitlab", label: "Masuk dengan GitLab" },
  // { provider: "bitbucket", label: "Masuk dengan Bitbucket" },
  { provider: "google", label: "Masuk dengan Google" },
];

// Mode Demo: gak nyentuh Supabase/backend asli, langsung pakai mock user
// dari demoMockUsers.ts sesuai role yang dipilih. Lihat AuthContext.tsx
// (readDemoParamsFromLocation) untuk parsing query param-nya.
const DEMO_OPTIONS: { role: DemoRole; label: string }[] = [
  { role: "cashier", label: "Demo sebagai Cashier" },
  { role: "owner", label: "Demo sebagai Owner" },
  { role: "developer", label: "Demo sebagai Developer" },
];

function goToDemo(role: DemoRole) {
  window.location.href = `${window.location.pathname}?demo=true&role=${role}`;
}

export default function Login() {
  const {
    isAuthenticated,
    isLoading,
    authError,
    loginWithEmail,
    loginWithOAuth,
  } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Simpan provider mana yang lagi loading, biar tombol lain gak ikut ke-disable/spin bareng.
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  // Kalau sudah login (atau lagi Mode Demo), langsung lempar ke dashboard / halaman asal.
  if (!isLoading && isAuthenticated) {
    const state = location.state as { from?: { pathname?: string } } | null;
    const from = state?.from?.pathname ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  // Prioritaskan authError dari context (mis. OAuth sukses di provider tapi sync ke
  // backend internal gagal) di atas error aksi lokal (mis. salah password submit form).
  const displayedError = authError ?? error;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setError(null);
    setOauthLoading(provider);
    try {
      await loginWithOAuth(provider);
    } catch (err) {
      setError(extractErrorMessage(err));
      setOauthLoading(null);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background-200 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tertiary text-lg font-bold text-white">
            S
          </div>
          <div>
            <p className="text-base font-semibold text-gray-1000">SistemPOS</p>
            <p className="text-xs text-gray-700">
              Portal internal karyawan & manajemen toko
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-alpha-400 bg-background-100 p-6 shadow-menu">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {displayedError && (
              <Alert variant="error" title="Gagal masuk">
                {displayedError}
              </Alert>
            )}

            <Input
              type="email"
              label="Email"
              placeholder="nama@tokokamu.com"
              leftIcon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <Input
              type="password"
              label="Kata sandi"
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              className="mt-1 w-full"
              isLoading={isSubmitting}
              disabled={oauthLoading !== null}>
              Masuk
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-alpha-400" />
            <span className="text-xs text-gray-700">atau</span>
            <div className="h-px flex-1 bg-gray-alpha-400" />
          </div>

          <div className="flex flex-col gap-2.5">
            {OAUTH_PROVIDERS.map(({ provider, label }) => (
              <Button
                key={provider}
                variant="outline"
                className="w-full"
                leftIcon={<ProviderIcon provider={provider} size={16} />}
                isLoading={oauthLoading === provider}
                disabled={
                  isSubmitting ||
                  (oauthLoading !== null && oauthLoading !== provider)
                }
                onClick={() => handleOAuthLogin(provider)}>
                {label}
              </Button>
            ))}
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-alpha-400" />
            <span className="text-xs text-gray-700">coba tanpa akun</span>
            <div className="h-px flex-1 bg-gray-alpha-400" />
          </div>

          <div className="flex flex-col gap-2.5">
            {DEMO_OPTIONS.map(({ role, label }) => (
              <Button
                key={role}
                variant="ghost"
                className="w-full"
                leftIcon={<Sparkles size={16} />}
                onClick={() => goToDemo(role)}>
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-700">
          <ShieldCheck size={13} />
          <span>Khusus karyawan terdaftar (Cashier / Owner / Developer)</span>
        </div>
      </div>
    </div>
  );
}
