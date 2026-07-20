// src/context/ThemeContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "sistempos:theme";

interface ThemeContextValue {
  /** Tema yang sedang aktif saat ini. */
  theme: Theme;
  /** True jika tema aktif adalah "dark". Shortcut biar gak perlu compare string di komponen. */
  isDark: boolean;
  /** Set tema secara eksplisit. */
  setTheme: (theme: Theme) => void;
  /** Toggle antara light <-> dark. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemPreferredTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return getSystemPreferredTheme();
}

/**
 * Terapkan/hapus class `.dark` di <html>.
 * index.css sudah didaftarkan pakai `@custom-variant dark (&:where(.dark, .dark *))`,
 * jadi cukup toggle class ini di root element untuk switch seluruh variabel CSS tema.
 */
function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  // Biar native form control (checkbox, scrollbar, dsb) ikut ganti warna.
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Sinkron ke DOM + localStorage tiap kali theme berubah.
  useEffect(() => {
    applyThemeClass(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Kalau user belum pernah override manual, ikutin perubahan preferensi sistem live.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = (event: MediaQueryListEvent) => {
      const hasManualOverride = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (hasManualOverride) return; // user udah pernah pilih manual, jangan timpa
      setThemeState(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme harus dipakai di dalam <ThemeProvider>, Bre!");
  }
  return ctx;
}
