"use client";

/**
 * Hook kirim posting (Fase 7) yang dipakai Antrian review dan Kalender.
 *
 * Tugasnya menjaga tiga aturan:
 *   1. Tombol kirim hanya muncul kalau provider melaporkan tersedia
 *      (`/api/posting/ketersediaan`), bukan menebak dari env (AGENTS aturan 8).
 *   2. Setiap kirim lewat satu jalur saja: POST /api/posting/kirim. Token
 *      Threads tidak pernah ada di klien (aturan 11).
 *   3. Provider gagal tidak menghilangkan konten — hasilnya dikembalikan apa
 *      adanya supaya pemanggil bisa menawarkan salin manual (ADR 0002).
 */
import { useCallback, useEffect, useState } from "react";
import type { Konten } from "@/lib/konten/skema";
import { periksaKirim, type HasilPeriksa } from "@/lib/posting/antrian";
import type {
  HasilKirim,
  KetersediaanProvider,
  PenyediaPosting,
} from "@/lib/posting/skema";
import {
  catatKirim,
  muatPengaturanPosting,
  muatRiwayatKirim,
} from "@/lib/posting/store";

export interface PakaiPosting {
  /** false selama ketersediaan provider belum dijawab server. */
  siap: boolean;
  /** Provider yang benar-benar dipakai (setelah fallback ke manual). */
  efektif: PenyediaPosting;
  tersedia: KetersediaanProvider[];
  /** True hanya kalau provider API (Threads) siap dipakai. */
  bisaKirimApi: boolean;
  /** Pesan error terakhir, ditampilkan di UI. */
  pesan: string | null;
  setPesan: (pesan: string | null) => void;
  /** Periksa apakah konten ini boleh dikirim sekarang (jeda, batas, jadwal). */
  izinKirim: (konten: Konten) => HasilPeriksa;
  /** Jalankan pengiriman; selalu mengembalikan hasil, tidak pernah throw. */
  kirim: (konten: Konten) => Promise<HasilKirim>;
}

export function usePosting(): PakaiPosting {
  const [siap, setSiap] = useState(false);
  const [efektif, setEfektif] = useState<PenyediaPosting>("manual");
  const [tersedia, setTersedia] = useState<KetersediaanProvider[]>([]);
  const [pesan, setPesan] = useState<string | null>(null);

  useEffect(() => {
    let hidup = true;
    fetch("/api/posting/ketersediaan")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!hidup || !d?.ok) return;
        setEfektif(d.efektif === "threads_api" ? "threads_api" : "manual");
        setTersedia(Array.isArray(d.tersedia) ? d.tersedia : []);
      })
      .catch(() => {
        // Server tidak bisa dihubungi: tombol kirim API tidak muncul, dan
        // jalur manual (salin utas) tetap tersedia seperti biasa.
      })
      .finally(() => {
        if (hidup) setSiap(true);
      });
    return () => {
      hidup = false;
    };
  }, []);

  const izinKirim = useCallback((konten: Konten): HasilPeriksa => {
    return periksaKirim(konten, muatRiwayatKirim(), muatPengaturanPosting());
  }, []);

  const kirim = useCallback(
    async (konten: Konten): Promise<HasilKirim> => {
      const pengaturan = muatPengaturanPosting();
      const riwayat = muatRiwayatKirim();
      // Gerbang yang sama juga ada di server; cek di sini supaya tombol bisa
      // memberi alasan tanpa menembak API.
      const izin = periksaKirim(konten, riwayat, pengaturan);
      if (!izin.boleh) {
        const ditolak: HasilKirim = {
          ok: false,
          penyedia: efektif,
          id_terkirim: [],
          error: izin.alasan ?? "Konten ini belum boleh dikirim.",
          jatuh_ke_manual: false,
        };
        setPesan(ditolak.error);
        return ditolak;
      }

      try {
        const res = await fetch("/api/posting/kirim", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            konten: {
              id: konten.id,
              judul: konten.judul,
              status: konten.status,
              statuses: konten.statuses,
              jadwal_at: konten.jadwal_at,
            },
            pengaturan,
            riwayat,
          }),
        });
        const data = (await res.json()) as HasilKirim;
        catatKirim({
          konten_id: konten.id,
          waktu: new Date().toISOString(),
          ok: data.ok === true,
          penyedia: data.penyedia ?? efektif,
        });
        setPesan(data.ok ? null : data.error ?? "Pengiriman gagal.");
        return data;
      } catch {
        const gagal: HasilKirim = {
          ok: false,
          penyedia: efektif,
          id_terkirim: [],
          error: "Tidak bisa menghubungi server. Coba lagi atau salin utas manual.",
          jatuh_ke_manual: true,
        };
        setPesan(gagal.error);
        return gagal;
      }
    },
    [efektif],
  );

  return {
    siap,
    efektif,
    tersedia,
    bisaKirimApi: tersedia.some((p) => p.id === "threads_api" && p.tersedia),
    pesan,
    setPesan,
    izinKirim,
    kirim,
  };
}
