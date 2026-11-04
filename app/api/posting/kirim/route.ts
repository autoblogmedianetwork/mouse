/**
 * POST /api/posting/kirim — kirim satu utas ke provider posting (Fase 7).
 *
 * Urutan kerjanya:
 *   0. Wajib sesi: rute ini bertindak atas nama pemilik akun.
 *   1. Validasi bentuk permintaan dengan Zod.
 *   2. Gerbang antrian: hanya konten yang sudah disetujui, jadwalnya tiba, dan
 *      belum melewati batas harian atau jeda antar posting (lib/posting/antrian).
 *   3. Panggil provider (manual selalu ada; threads_api hanya kalau tersedia).
 *      Provider gagal => hasilnya `jatuh_ke_manual`, dan UI menawarkan salin.
 *   4. Catat percobaan ke tabel `posts` (best-effort, server-only).
 *
 * Token Threads tidak pernah menyentuh klien; rute ini satu-satunya jalur kirim.
 */
import { NextResponse } from "next/server";
import { wajibSesi } from "@/lib/supabase/server";
import { periksaKirim } from "@/lib/posting/antrian";
import { catatPost, riwayatKirimServer } from "@/lib/posting/catat-post";
import { ambilProvider, penyediaEfektif } from "@/lib/posting/provider";
import { kirimRequestSkema, type CatatanKirim, type HasilKirim } from "@/lib/posting/skema";

export async function POST(req: Request) {
  // Rute ini mengirim atas nama pemilik akun, jadi sesi wajib — sebelumnya
  // tanpa sesi pun tetap jalan memakai riwayat dari klien.
  const sesi = await wajibSesi();
  if ("respons" in sesi) return sesi.respons;
  const { user, supabase } = sesi;

  let badan: unknown;
  try {
    badan = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON." }, { status: 400 });
  }

  const parsed = kirimRequestSkema.safeParse(badan);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Permintaan tidak valid." },
      { status: 400 },
    );
  }

  const { konten, pengaturan, riwayat } = parsed.data;

  // Sumber kuota: tabel `posts` (tidak bisa dipalsukan klien). Riwayat dari
  // klien hanya dipakai kalau server belum punya catatan sama sekali.
  let riwayatEfektif: CatatanKirim[] = riwayat;
  const dariServer = await riwayatKirimServer(supabase);
  if (dariServer.length > 0) riwayatEfektif = dariServer;

  const izin = periksaKirim(konten, riwayatEfektif, pengaturan);
  if (!izin.boleh) {
    // Bukan kegagalan provider: tidak ada yang perlu dikirim, jadi bukan 502.
    return NextResponse.json({
      ok: false,
      penyedia: penyediaEfektif(pengaturan.penyedia),
      id_terkirim: [],
      error: izin.alasan ?? "Konten ini belum boleh dikirim.",
      jatuh_ke_manual: false,
    } satisfies HasilKirim);
  }

  const provider = ambilProvider(pengaturan.penyedia);
  const hasil = await provider.kirim(konten.statuses);

  await catatPost(supabase, user.id, {
    kontenId: konten.id,
    judul: konten.judul,
    hasil,
    jumlahStatus: konten.statuses.length,
    // Rute ini selalu dipicu aksi user, jadi modenya manual dalam arti
    // "dikirim karena keputusan user", bukan oleh penjadwal otomatis (K12).
    mode: "manual",
  });

  return NextResponse.json(hasil);
}
