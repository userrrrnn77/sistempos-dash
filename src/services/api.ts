// src/services/api.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { isDemoModeActive } from "../utils/demoMockData";

const api = axios.create({
  // Ngebaca langsung dari file .env lu, Bre!
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

/** HTTP method yang dianggap mutasi (nulis/ubah/hapus data). GET & HEAD selalu aman. */
const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

// Otomatis inject JWT token dari localStorage ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Benteng Demo Mode - lapisan kedua (selain guardMutation di AuthContext).
 * Mencegat semua request mutasi (POST/PUT/PATCH/DELETE) selama Mode Demo aktif,
 * jaga-jaga kalau ada handler yang lupa dipasangi guardMutation() di level UI.
 */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? "get").toLowerCase();

  if (isDemoModeActive() && MUTATING_METHODS.has(method)) {
    window.alert("Aksi Ditolak! Anda sedang berada dalam Mode Demo Read-Only.");

    // Batalkan request pakai AbortController -> ditangkap sebagai error di caller,
    // bukan network call beneran ke backend.
    const controller = new AbortController();
    controller.abort();
    config.signal = controller.signal;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      // Request dibatalkan oleh benteng Demo Mode di atas, biarkan lewat sebagai rejection biasa
      // supaya caller (try/catch) tetap tau aksinya gak jalan, tanpa nge-spam console.
      return Promise.reject(error);
    }
    return Promise.reject(error);
  },
);

export default api;
