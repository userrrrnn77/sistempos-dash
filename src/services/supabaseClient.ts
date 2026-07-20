// src/services/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Jangan crash total di Mode Demo (yang tidak butuh Supabase),
  // tapi tetap kasih warning yang jelas di console biar gampang di-debug.
  console.warn(
    "[SistemPOS] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum di-set. " +
      "Login asli via Supabase tidak akan berfungsi sampai .env diisi.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

/** Provider OAuth yang aktif di Supabase project (lihat Auth > Providers). */
export type OAuthProvider = "github" | "google" | "bitbucket" | "gitlab";
