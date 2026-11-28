/**
 * GET /auth/threads/callback — terima kode OAuth, tukar token jangka
 * panjang (60 hari), simpan TERENKRIPSI, lalu kembali ke Pengaturan.
 *
 * Proteksi: state cookie harus sama dengan query state (CSRF), user harus
 * masih login, dan env harus terisi. Semua galat dialihkan ke
 * /pengaturan?threads_galat=... supaya user melihat pesan di tempat yang
 * familiar, bukan halaman putih.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import { konfigurasiThreads, tukarKode } from "@/lib/threads-api/config";
import { simpanAkun } from "@/lib/threads-api/akun";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kembali = (galat?: string) =>
    NextResponse.redirect(`${url.origin}/pengaturan${galat ? `?threads_galat=${encodeURIComponent(galat)}` : "?threads_ok=1"}`);

  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) return kembali("Sesi habis. Login dulu lalu sambungkan ulang.");

  const galatOauth = url.searchParams.get("error_description");
  if (galatOauth) return kembali(galatOauth.slice(0, 200));

  const kode = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("threads_oauth_state")?.value;
  if (!kode || !state || !stateCookie || state !== stateCookie) {
    return kembali("Verifikasi keamanan gagal (state tidak cocok). Coba sambungkan ulang.");
  }
  cookieStore.delete("threads_oauth_state");

  const konfig = konfigurasiThreads(url.origin);
  if (!konfig) return kembali("THREADS_APP_ID/SECRET belum diisi di server.");

  try {
    const hasil = await tukarKode(konfig, kode);
    const simpan = await simpanAkun(user.id, hasil);
    if (!simpan.ok) return kembali(simpan.galat);
    return kembali();
  } catch (e) {
    return kembali(e instanceof Error ? e.message : "Pertukaran token gagal.");
  }
}
