/**
 * GET /api/threads/authorize — mulai OAuth Threads (Fase 7, ADR 0023).
 *
 * Membuat `state` acak, menyimpannya di cookie httpOnly (dibandingkan di
 * callback — penangkal CSRF), lalu mengarahkan ke threads.com/oauth/authorize.
 * Env belum terisi: balasan JSON berisi petunjuk pemasangan, bukan error.
 */
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import { konfigurasiThreads, urlOtorisasi } from "@/lib/threads-api/config";

export async function GET(req: Request) {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) {
    return NextResponse.json({ ok: false, galat: "Login dulu sebelum menyambungkan Threads." }, { status: 401 });
  }

  const origin = new URL(req.url).origin;
  const konfig = konfigurasiThreads(origin);
  if (!konfig) {
    return NextResponse.json(
      {
        ok: false,
        galat:
          "THREADS_APP_ID / THREADS_APP_SECRET belum diisi di server. Buat Meta app dengan use case Threads, lalu tambahkan dua env itu di Vercel.",
      },
      { status: 400 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("threads_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(urlOtorisasi(konfig, state));
}
