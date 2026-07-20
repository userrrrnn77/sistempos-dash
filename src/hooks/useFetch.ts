// src/hooks/useFetch.ts
import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";

interface UseFetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/** Ekstrak pesan error yang enak dibaca dari response backend (`{ error: string }`) atau Axios/Error biasa. */
export function extractErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
  const backendMessage =
    axiosErr?.response?.data?.error ?? axiosErr?.response?.data?.message;
  if (backendMessage) return backendMessage;
  if (err instanceof Error) return err.message;
  return "Terjadi kesalahan tak terduga, Bre!";
}

/**
 * Hook generik untuk fetch data dari API saat mount (atau saat `deps` berubah).
 * Ditujukan untuk halaman-halaman list/detail (Employees, Products, Branches, dst)
 * biar tidak menulis ulang boilerplate isLoading/error/refetch di setiap page.
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): UseFetchState<T> & { refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!isMounted) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken, ...deps]);

  return { data, isLoading, error, refetch };
}
