/**
 * GET /api/akun — Muat daftar akun sosial milik user dari Supabase (Fase 7, ADR 0002).
 * POST /api/akun — Tambah atau hubungkan akun Threads baru.
 * DELETE /api/akun — Putuskan akun sosial yang terhubung.
 *
 * Sesuai AGENTS aturan 11, token akses hanya di server dan tidak pernah
 * dikirim ke komponen klien. Klien hanya menerima status koneksi dan metadata.
 */
import { NextResponse } from "next/server";
import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";
import {
  akunBaruSkema,
  normalisasiUsername,
  tentukanStatusKoneksi,
  type AkunSosial,
} from "@/lib/akun/skema";

export async function GET() {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;

  const serverUserId = process.env.THREADS_USER_ID?.trim() || "";
  const serverHasToken = Boolean(process.env.THREADS_ACCESS_TOKEN?.trim());
  const serverEnvConfigured = Boolean(serverUserId && serverHasToken);

  // Jika belum login ke Supabase
  if (!supabase || !user) {
    const akunBawaan: AkunSosial[] = [];
    if (serverEnvConfigured) {
      akunBawaan.push({
        id: "env-threads-account",
        platform: "Threads",
        username: normalisasiUsername(serverUserId),
        nama_tampilan: "Akun Server (.env)",
        threads_user_id: serverUserId,
        status: "terhubung",
        terakhir_sinkron_at: new Date().toISOString(),
        mode: "otomatis",
        catatan: "Dikonfigurasi lewat THREADS_USER_ID di server.",
      });
    }

    return NextResponse.json({
      ok: true,
      tersedia: Boolean(supabase),
      butuhSesi: !user,
      serverEnvConfigured,
      akun: akunBawaan,
    });
  }

  // Ambil dari Supabase `threads_accounts`
  const { data, error } = await supabase
    .from("threads_accounts")
    .select(
      "id, threads_user_id, nama_tampilan, token_kedaluwarsa_at, status_koneksi, terakhir_diperbarui_at",
    )
    .order("terakhir_diperbarui_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, akun: [] },
      { status: 502 },
    );
  }

  const akunList: AkunSosial[] = (data || []).map((row) => ({
    id: String(row.id),
    platform: "Threads",
    username: normalisasiUsername(row.nama_tampilan || row.threads_user_id),
    nama_tampilan: row.nama_tampilan || normalisasiUsername(row.threads_user_id),
    threads_user_id: row.threads_user_id,
    status: (row.status_koneksi as AkunSosial["status"]) || "terhubung",
    token_kedaluwarsa_at: row.token_kedaluwarsa_at,
    terakhir_sinkron_at: row.terakhir_diperbarui_at,
    mode: "otomatis",
  }));

  // Jika database belum punya akun tapi server env sudah diisi, sertakan akun server
  if (akunList.length === 0 && serverEnvConfigured) {
    akunList.push({
      id: "env-threads-account",
      platform: "Threads",
      username: normalisasiUsername(serverUserId),
      nama_tampilan: "Akun Server (.env)",
      threads_user_id: serverUserId,
      status: "terhubung",
      terakhir_sinkron_at: new Date().toISOString(),
      mode: "otomatis",
      catatan: "Dikonfigurasi lewat THREADS_USER_ID di server.",
    });
  }

  return NextResponse.json({
    ok: true,
    tersedia: true,
    serverEnvConfigured,
    akun: akunList,
  });
}

export async function POST(req: Request) {
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Format request tidak valid (harus JSON)." },
      { status: 400 },
    );
  }

  const parseResult = akunBaruSkema.safeParse(bodyJson);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      },
      { status: 400 },
    );
  }

  const input = parseResult.data;
  const usernameBersih = normalisasiUsername(input.username);
  const threadsUserId =
    input.threads_user_id?.trim() || usernameBersih.replace(/^@/, "");

  const status = tentukanStatusKoneksi(undefined, input.mode);

  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;

  let idBaru = `local-${Date.now()}`;

  // Jika tersambung ke Supabase & user terautentikasi
  if (supabase && user) {
    const { data, error } = await supabase
      .from("threads_accounts")
      .upsert(
        {
          user_id: user.id,
          threads_user_id: threadsUserId,
          nama_tampilan: input.nama_tampilan || usernameBersih,
          token_terenkripsi: input.access_token || "manual-mode-token",
          status_koneksi: status === "menunggu_konfigurasi" ? "terhubung" : status,
          terakhir_diperbarui_at: new Date().toISOString(),
        },
        { onConflict: "user_id, threads_user_id" },
      )
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: `Gagal menyimpan akun ke database: ${error.message}` },
        { status: 502 },
      );
    }
    if (data?.id) {
      idBaru = String(data.id);
    }
  }

  const akunHasil: AkunSosial = {
    id: idBaru,
    platform: input.platform,
    username: usernameBersih,
    nama_tampilan: input.nama_tampilan || usernameBersih,
    threads_user_id: threadsUserId,
    status,
    terakhir_sinkron_at: new Date().toISOString(),
    mode: input.mode,
    catatan: input.catatan,
  };

  return NextResponse.json({
    ok: true,
    akun: akunHasil,
  });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "ID akun diperlukan untuk penghapusan." },
      { status: 400 },
    );
  }

  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;

  if (supabase && user && !id.startsWith("local-") && !id.startsWith("env-")) {
    const { error } = await supabase
      .from("threads_accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: `Gagal menghapus akun: ${error.message}` },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ ok: true, deletedId: id });
}
