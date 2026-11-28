"use client";

/**
 * Pengirim tertunda saat aplikasi dibuka.
 *
 * Masalah yang diselesaikan: kiriman berjadwal butuh pemicu berkala, tapi paket
 * Vercel Hobby hanya mengizinkan cron sekali sehari. Daripada menambah
 * penjadwal luar (pg_cron, akun cron-job.org, dsb), aplikasi memicu dirinya
 * sendiri setiap kali kamu membukanya — endpoint yang sama sudah mendukung mode
 * sesi dan hanya memproses konten milikmu.
 *
 * Batasnya jujur: kiriman terkirim saat aplikasi dibuka, bukan tepat pada
 * menitnya. Kalau butuh presisi, lihat docs/jadwal-kirim.md (pg_cron).
 *
 * Pengaman:
 * - Jeda 5 menit lewat localStorage, supaya pindah halaman tidak memicu
 *   permintaan berulang dan dua tab tidak berebut baris yang sama.
 * - Gagal = diam. Tanpa sesi atau tanpa akun Threads, tidak ada yang dikirim
 *   dan tidak ada pesan galat yang mengganggu.
 */
import { useEffect, useState } from "react";

const KUNCI_JEDA = "autothreads-kirim-terakhir";
const JEDA_MS = 5 * 60 * 1000;

export function PengirimTertunda() {
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    const terakhir = Number(window.localStorage.getItem(KUNCI_JEDA) ?? "0");
    if (Number.isFinite(terakhir) && Date.now() - terakhir < JEDA_MS) return;
    window.localStorage.setItem(KUNCI_JEDA, String(Date.now()));

    let batal = false;
    fetch("/api/threads/proses-jadwal", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { diproses?: number; sukses?: number; gagal?: number } | null) => {
        if (batal || !data) return;
        const diproses = data.diproses ?? 0;
        if (diproses === 0) return;
        setPesan(
          `${data.sukses ?? 0} kiriman terjadwal terkirim` +
            ((data.gagal ?? 0) > 0 ? `, ${data.gagal} gagal (cek Antrian).` : "."),
        );
        setTimeout(() => setPesan(""), 8000);
      })
      .catch(() => {
        /* offline atau sesi habis: diam saja */
      });

    return () => {
      batal = true;
    };
  }, []);

  if (!pesan) return null;

  return (
    <p className="border border-surface-border bg-surface px-3.5 py-2 text-meta" aria-live="polite">
      {pesan}
    </p>
  );
}
