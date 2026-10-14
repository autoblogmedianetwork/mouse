"use client";

/**
 * Riwayat hasil terakhir (N-5): 15 konten terakhir dibaca dari tabel `contents`
 * di Supabase, bukan localStorage. Saat halaman dibuka, konten yang masih ada
 * di localStorage dikirim sekali ke tabel yang sama (upsert id yang sama, jadi
 * aman diulang dan tidak menggandakan baris).
 */
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { muatKonten } from "@/lib/konten/store";
import { RIWAYAT_LIMIT, belumDikirim } from "@/lib/konten/supabase-konten";
import type { Konten } from "@/lib/konten/skema";
import { PESAN_ENV_KURANG } from "@/lib/supabase/klien";

type Keadaan = "memuat" | "siap" | "tidak-tersedia" | "gagal";

interface JawabanKonten {
  ok?: boolean;
  tersedia?: boolean;
  /** "env" kalau Supabase belum diisi, "sesi" kalau user belum masuk. */
  alasan?: "env" | "sesi";
  error?: string;
  baris?: Konten[];
  dikirim?: number;
  dilewati?: number;
}

async function ambilRiwayat(): Promise<JawabanKonten | null> {
  try {
    const res = await fetch("/api/konten", { cache: "no-store" });
    return (await res.json()) as JawabanKonten;
  } catch {
    return null;
  }
}

export function RiwayatSupabase() {
  const [keadaan, setKeadaan] = useState<Keadaan>("memuat");
  const [baris, setBaris] = useState<Konten[]>([]);
  const [pesan, setPesan] = useState<string | null>(null);
  const [alasan, setAlasan] = useState<"env" | "sesi">("env");

  useEffect(() => {
    let aktif = true;

    const jalan = async () => {
      const pertama = await ambilRiwayat();
      if (!aktif) return;

      if (!pertama) {
        setKeadaan("gagal");
        setPesan("Tidak bisa menghubungi server. Coba muat ulang halaman.");
        return;
      }
      if (!pertama.ok) {
        setKeadaan("gagal");
        setPesan(pertama.error ?? "Gagal membaca riwayat dari Supabase.");
        return;
      }
      if (!pertama.tersedia) {
        setAlasan(pertama.alasan ?? "env");
        setKeadaan("tidak-tersedia");
        return;
      }

      const awal = pertama.baris ?? [];
      const lokal = muatKonten();
      const perluKirim = belumDikirim(lokal, awal);

      if (perluKirim.length === 0) {
        setBaris(awal);
        setKeadaan("siap");
        return;
      }

      // Kirim sekali; user tidak diminta memilih karena id dan statusnya sama.
      let jawabKirim: JawabanKonten | null = null;
      try {
        const res = await fetch("/api/konten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ konten: perluKirim }),
        });
        jawabKirim = (await res.json()) as JawabanKonten;
      } catch {
        jawabKirim = null;
      }
      if (!aktif) return;

      if (jawabKirim?.ok && jawabKirim.tersedia) {
        setPesan(
          `${jawabKirim.dikirim ?? 0} konten dari perangkat ini dikirim ke Supabase` +
            (jawabKirim.dilewati ? `, ${jawabKirim.dilewati} dilewati karena belum lengkap` : "") +
            ".",
        );
        const ulang = await ambilRiwayat();
        if (!aktif) return;
        setBaris(ulang?.baris ?? awal);
        setKeadaan("siap");
        return;
      }

      setBaris(awal);
      setKeadaan("siap");
      setPesan(jawabKirim?.error ?? "Konten lokal belum bisa dikirim ke Supabase.");
    };

    void jalan();
    return () => {
      aktif = false;
    };
  }, []);

  return (
    <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Riwayat hasil terakhir</h2>
        <span className="text-xs text-muted-foreground">
          Maksimal {RIWAYAT_LIMIT} konten, dari tabel contents di Supabase
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Data diambil dari database, bukan dari penyimpanan browser. Semua konten di
        sini tetap berstatus draft sampai Anda menandainya siap posting.
      </p>

      {pesan ? (
        <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
          {pesan}
        </p>
      ) : null}

      {keadaan === "memuat" ? (
        <p className="mt-3 text-sm text-muted-foreground">Memuat riwayat…</p>
      ) : null}

      {keadaan === "tidak-tersedia" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {alasan === "sesi"
            ? "Masuk dulu untuk melihat riwayat dari database. Selama belum masuk, riwayat tidak ditampilkan supaya tidak ada data yang tampak padahal belum tersimpan."
            : `${PESAN_ENV_KURANG} Selama belum tersambung, riwayat di bawah ini tidak ditampilkan supaya tidak ada data yang tampak padahal belum tersimpan.`}
        </p>
      ) : null}

      {keadaan === "gagal" ? (
        <p className="mt-3 text-sm text-status-failed">{pesan}</p>
      ) : null}

      {keadaan === "siap" && baris.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Belum ada konten di database. Konten yang Anda buat lewat Buat posting akan
          muncul di sini.
        </p>
      ) : null}

      {keadaan === "siap" && baris.length > 0 ? (
        <ul className="mt-3 divide-y divide-surface-border">
          {baris.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{k.judul}</p>
                <p className="text-xs text-muted-foreground">
                  {k.statuses.length} status · {new Date(k.updated_at).toLocaleString("id-ID")}
                </p>
              </div>
              <StatusBadge status={k.status} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
