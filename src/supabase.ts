import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { loadConfig } from "./config.js";

let cached: SupabaseClient | null = null;

/** Shared Supabase client built lazily from validated env config. */
export function supabase(): SupabaseClient {
  if (cached) return cached;
  const cfg = loadConfig();
  cached = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
