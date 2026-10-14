/**
 * Aturan antrian posting (Fase 7): siapa yang boleh dikirim, kapan, dan berapa
 * banyak. Semua fungsi murni — tanpa fetch dan tanpa storage — supaya aturan
 * "konten belum disetujui tidak pernah terkirim" dan batas harian bisa diuji
 * unit tanpa menyentuh API Threads.
 *
 * Catatan penting (AGENTS aturan 4): modul ini TIDAK mengirim apa pun sendiri.
 * Ia hanya menjawab boleh/tidak; pengiriman selalu dipicu aksi user. Pengirim
 * otomatis latar belakang baru boleh dibuat setelah K12 disetujui.
 */
import type { Konten } from "@/lib/konten/skema";
import {
  STATUS_BOLEH_KIRIM,
  type CatatanKirim,
  type PengaturanPosting,
} from "./skema";

/** Jendela kuota 24 jam berjalan, sama seperti kuota resmi Threads. */
const JENDELA_MS = 24 * 60 * 60 * 1000;

export interface HasilPeriksa {
  boleh: boolean;
  alasan?: string;
}

/** Postingan yang benar-benar berhasil dalam 24 jam terakhir. */
export function terkirimDalam24Jam(riwayat: CatatanKirim[], now = new Date()): number {
  const batas = now.getTime() - JENDELA_MS;
  return riwayat.filter((c) => {
    if (!c.ok) return false;
    const t = Date.parse(c.waktu);
    return Number.isFinite(t) && t >= batas;
  }).length;
}

/**
 * Sisa jeda wajib dalam detik. 0 berarti boleh kirim sekarang.
 * Dihitung dari percobaan sukses terakhir, termasuk yang terjadi di sesi lain
 * (riwayat disimpan bersama konten, jadi tidak hilang saat halaman dimuat ulang).
 */
export function jedaTersisaDetik(
  riwayat: CatatanKirim[],
  pengaturan: Pick<PengaturanPosting, "jeda_detik">,
  now = new Date(),
): number {
  const terakhir = riwayat
    .filter((c) => c.ok)
    .map((c) => Date.parse(c.waktu))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a)[0];
  if (terakhir === undefined) return 0;
  const sisa = Math.ceil((terakhir + pengaturan.jeda_detik * 1000 - now.getTime()) / 1000);
  return Math.max(0, sisa);
}

/** Jumlah byte UTF-8, cara Threads menghitung emoji untuk batas 500. */
export function panjangByte(teks: string): number {
  let n = 0;
  for (const karakter of teks) {
    const cp = karakter.codePointAt(0) ?? 0;
    if (cp <= 0x7f) n += 1;
    else if (cp <= 0x7ff) n += 2;
    else if (cp <= 0xffff) n += 3;
    else n += 4;
  }
  return n;
}

export type KontenKirim = Pick<Konten, "id" | "judul" | "status" | "statuses" | "jadwal_at">;

/**
 * Gerbang tunggal sebelum provider dipanggil: konten harus sudah disetujui
 * (siap posting / terjadwal / gagal untuk coba lagi), jadwalnya sudah tiba, dan
 * kuota harian serta jeda antar posting belum terlampaui.
 */
export function periksaKirim(
  konten: KontenKirim,
  riwayat: CatatanKirim[],
  pengaturan: PengaturanPosting,
  now = new Date(),
): HasilPeriksa {
  if (konten.statuses.length === 0) {
    return { boleh: false, alasan: "Konten tidak punya satu pun status." };
  }

  if (!STATUS_BOLEH_KIRIM.includes(konten.status as (typeof STATUS_BOLEH_KIRIM)[number])) {
    return {
      boleh: false,
      alasan: "Hanya konten yang sudah disetujui (siap posting, terjadwal, atau gagal) yang bisa dikirim.",
    };
  }

  // Terjadwal tapi belum waktunya: jangan kirim lebih awal.
  if (konten.status === "terjadwal" && konten.jadwal_at) {
    const t = Date.parse(konten.jadwal_at);
    if (Number.isFinite(t) && t > now.getTime()) {
      return {
        boleh: false,
        alasan: `Jadwal belum tiba (${new Date(t).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        })}).`,
      };
    }
  }

  // Threads menghitung emoji sebagai beberapa byte; batas kode 500 karakter
  // tidak cukup, jadi byte juga diperiksa sebelum menembak API.
  const terlaluPanjang = konten.statuses.find((s) => panjangByte(s) > 500);
  if (terlaluPanjang !== undefined) {
    return {
      boleh: false,
      alasan: `Ada status yang melebihi 500 byte (${panjangByte(terlaluPanjang)} byte).`,
    };
  }

  if (terkirimDalam24Jam(riwayat, now) >= pengaturan.batas_harian) {
    return {
      boleh: false,
      alasan: `Batas kirim ${pengaturan.batas_harian} posting per 24 jam sudah tercapai.`,
    };
  }

  const sisa = jedaTersisaDetik(riwayat, pengaturan, now);
  if (sisa > 0) {
    return { boleh: false, alasan: `Tunggu ${sisa} detik lagi (jeda antar posting).` };
  }

  return { boleh: true };
}

export type StatusAntrian = "siap" | "tertahan" | "tidak_boleh";

export interface BarisAntrian {
  konten: KontenKirim;
  status: StatusAntrian;
  alasan?: string;
}

/**
 * Peta antrian untuk UI: mana yang tombol kirimnya aktif, mana yang tertahan
 * kuota, dan mana yang memang bukan kandidat (draft/ditolak).
 * `now` diteruskan supaya pemanggil tidak perlu membaca jam saat render.
 */
export function petaAntrian(
  list: KontenKirim[],
  riwayat: CatatanKirim[],
  pengaturan: PengaturanPosting,
  now = new Date(),
): BarisAntrian[] {
  return list.map((konten) => {
    const hasil = periksaKirim(konten, riwayat, pengaturan, now);
    if (hasil.boleh) return { konten, status: "siap" as const };
    const kandidat = STATUS_BOLEH_KIRIM.includes(
      konten.status as (typeof STATUS_BOLEH_KIRIM)[number],
    );
    return {
      konten,
      status: kandidat ? ("tertahan" as const) : ("tidak_boleh" as const),
      alasan: hasil.alasan,
    };
  });
}
