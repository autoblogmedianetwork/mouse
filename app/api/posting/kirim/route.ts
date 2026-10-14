/**
 * POST /api/posting/kirim — kirim satu utas ke provider posting (Fase 7).
 *
 * Urutan kerjanya:
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
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import { periksaKirim } from "@/lib/posting/antrian";
import { catatPost, riwayatKirimServer } from "@/lib/posting/catat-post";
import { ambilProvider, penyediaEfektif } from "@/lib/posting/provider";
import { kirimRequestSkema, type CatatanKirim, type HasilKirim } from "@/lib/posting/skema";

export async function POST(req: Request) {
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
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;

  // Sumber kuota: tabel `posts` saat Supabase aktif (tidak bisa dipalsukan
  // klien), kalau tidak riwayat dari klien (pustaka masih di localStorage).
  let riwayatEfektif: CatatanKirim[] = riwayat;
  if (supabase && user) {
    const dariServer = await riwayatKirimServer(supabase);
    if (dariServer.length > 0) riwayatEfektif = dariServer;
  }

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

  if (supabase && user) {
    await catatPost(supabase, user.id, {
      kontenId: konten.id,
      judul: konten.judul,
      hasil,
      jumlahStatus: konten.statuses.length,
      // Rute ini selalu dipicu aksi user, jadi modenya manual dalam arti
      // "dikirim karena keputusan user", bukan oleh penjadwal otomatis (K12).
      mode: "manual",
    });
  }

  return NextResponse.json(hasil);
}
