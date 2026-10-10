/**
 * Browser Supabase client.
 *
 * Only NEXT_PUBLIC_* values are read here, so the service role key never
 * reaches the browser (AGENTS rule 8). Components must not create their own
 * client; import this singleton so cookies and auth state stay in one place.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export const PESAN_ENV_KURANG =
  "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local.";

let tersimpan: SupabaseClient | null = null;

/** True when both public Supabase variables are present. */
export function supabaseSiap(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Returns the shared browser client, or null when the environment is not
 * configured so callers can show a message instead of crashing.
 */
export function klienPeramban(): SupabaseClient | null {
  if (!supabaseSiap()) return null;
  if (!tersimpan) {
    tersimpan = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    );
  }
  return tersimpan;
}
