/**
 * Magic link callback (K4: login pakai magic link email).
 *
 * Supabase sends the user here with `?code=...`; we exchange it for a session
 * cookie and forward to `next` (default "/"). Failures go back to /masuk with a
 * readable reason instead of a blank page.
 */
import { NextResponse, type NextRequest } from "next/server";
import { klienServer } from "@/lib/supabase/server";

/** Only internal paths are allowed, so the link cannot bounce to another site. */
function tujuanAman(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = tujuanAman(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/masuk?galat=${encodeURIComponent("Tautan tidak memuat kode login.")}`);
  }

  const supabase = await klienServer();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/masuk?galat=${encodeURIComponent("Supabase belum dikonfigurasi.")}`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/masuk?galat=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
