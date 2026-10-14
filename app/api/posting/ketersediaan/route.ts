/**
 * GET /api/posting/ketersediaan — provider posting mana yang siap dipakai.
 *
 * UI memakai ini alih-alih membaca env sendiri: komponen klien tidak pernah
 * tahu isi THREADS_ACCESS_TOKEN, dan tombol kirim hanya muncul kalau provider
 * melaporkan `tersedia` (AGENTS aturan 8). Mode manual selalu tersedia
 * (aturan 7), jadi jawaban tidak pernah kosong.
 */
import { NextResponse } from "next/server";
import { daftarKetersediaan, penyediaDariEnv, penyediaEfektif } from "@/lib/posting/provider";

export async function GET() {
  const diminta = penyediaDariEnv();
  return NextResponse.json({
    ok: true,
    /** Pilihan dari env POSTING_PROVIDER. */
    diminta,
    /** Yang benar-benar akan dipakai setelah fallback ke manual. */
    efektif: penyediaEfektif(diminta),
    tersedia: daftarKetersediaan(),
    /** Batas platform saat dokumen ini ditulis, ditampilkan sebagai catatan. */
    catatan:
      "Threads membatasi 250 posting dan 1.000 balasan per 24 jam. Batas harian aplikasi diatur di Pengaturan.",
  });
}
