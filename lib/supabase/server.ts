/**
 * Server Supabase client (Route Handlers, Server Actions, Server Components).
 *
 * Cookies carry the session, so token refreshes must be written back before the
 * response is committed — call `auth.getClaims()` early in the handler.
 *
 * Server-only: SUPABASE_SERVICE_ROLE_KEY is never read here (AGENTS rule 8).
 * Client components must use lib/supabase/klien.ts instead.
 */
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/** Same env guard as the browser client, so both report the same problem. */
export function supabaseSiap(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Builds a client bound to the current request's cookies. Returns null when the
 * environment is not configured, so routes can answer with a clear message.
 */
export async function klienServer() {
  if (!supabaseSiap()) return null;
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot write cookies. The refresh still happens
            // in proxy.ts for every request, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/** Current user, or null when signed out / not configured. */
export async function penggunaSaatIni() {
  const supabase = await klienServer();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

/**
 * Guard for route handlers that spend money or act on the owner's behalf.
 *
 * The AI routes and /api/posting/kirim were callable without a session, so
 * anyone who found the URL could bill the AI account or post as the owner.
 * Returns the user, or a ready-made response to return immediately:
 *
 *   const sesi = await wajibSesi();
 *   if ("respons" in sesi) return sesi.respons;
 *
 * 503 (not 401) when the environment is missing: that is a server fault, not
 * a sign-in problem, and the UI must not tell the user to log in again.
 */
export async function wajibSesi(): Promise<
  { user: User; supabase: NonNullable<Awaited<ReturnType<typeof klienServer>>> } | { respons: NextResponse }
> {
  const supabase = await klienServer();
  if (!supabase) {
    return {
      respons: NextResponse.json(
        { ok: false, error: "Supabase belum dikonfigurasi di server." },
        { status: 503 },
      ),
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      respons: NextResponse.json(
        { ok: false, error: "Sesi tidak ditemukan. Masuk dulu untuk memakai fitur ini." },
        { status: 401 },
      ),
    };
  }

  return { user: data.user, supabase };
}
