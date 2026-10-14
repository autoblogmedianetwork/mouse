/**
 * Atribusi komisi ke konten lewat sub_id.
 *
 * Setiap konten punya kode pelacak bawaan (misalnya `at-3f9c21`). Kode itu
 * ditempel user di pembuat link affiliate. Saat laporan marketplace diimpor,
 * kolom Sub_id/Creator dicocokkan dengan kode tersebut, sehingga dashboard bisa
 * menjawab "utas mana yang menghasilkan uang" tanpa menebak.
 *
 * Fungsi di berkas ini murni (tanpa storage) supaya bisa diuji dan dipakai
 * ulang oleh dashboard maupun halaman Analitik.
 */
import type { BarisPerforma } from "@/lib/impor/skema";
import { buatIdBaris } from "@/lib/impor/performa";
import { LABEL_GAYA_HOOK, LABEL_LETAK_LINK, type Konten } from "@/lib/konten/skema";
import { normalkanSubId, type PetaAtribusi } from "./skema";

/**
 * Kode pelacak bawaan dari id konten: stabil (id tidak berubah), pendek, dan
 * mudah ditempel di pembuat link. Tidak memakai angka acak supaya impor lama
 * tetap cocok meski aplikasi di-reload.
 */
export function subIdDefault(kontenId: string): string {
  return `at-${buatIdBaris(kontenId).slice(1, 7)}`;
}

export interface RingkasanKontenPerforma {
  konten_id: string;
  judul: string;
  /** Ide/angle yang dipilih saat konten dibuat (PRD F2). */
  angle: string;
  /** Hook style and link placement, so A/B per variable can be read (PRD F11). */
  gaya_hook: Konten["gaya_hook"];
  letak_link: Konten["letak_link"];
  produk_nama: string;
  status: Konten["status"];
  sub_ids: string[];
  baris: number;
  komisi: number;
  komisi_cair: number;
  pesanan: number;
  /** Klik dari laporan marketplace. */
  klik_impor: number;
  /** Klik yang dicatat manual di Pustaka/Link affiliate. */
  klik_manual: number;
  /** Klik yang dipakai untuk konversi: impor bila ada, kalau tidak manual. */
  klik_dipakai: number;
  komisi_per_klik: number;
  konversi: number;
}

export interface SubIdBelumTerpetakan {
  sub_id: string;
  baris: number;
  komisi: number;
  klik: number;
  pesanan: number;
}

export interface RingkasanAngle {
  angle: string;
  konten: number;
  komisi: number;
  komisi_cair: number;
  pesanan: number;
  klik: number;
  konversi: number;
}

/**
 * One row of a per-variable recap (hook style, link placement). Same shape for
 * every A/B dimension so the UI can render them with one component.
 */
export interface RingkasanDimensi {
  /** Raw stored value, e.g. "pertanyaan" or "balasan". */
  kunci: string;
  /** Human label; unknown values fall back to the raw value, never hidden. */
  label: string;
  konten: number;
  komisi: number;
  komisi_cair: number;
  pesanan: number;
  klik: number;
  konversi: number;
}

export interface HasilAtribusi {
  per_konten: RingkasanKontenPerforma[];
  per_angle: RingkasanAngle[];
  /** A/B per gaya hook (Fase 6, PRD F11). */
  per_hook: RingkasanDimensi[];
  /** A/B per letak link (Fase 6, PRD F11). */
  per_letak_link: RingkasanDimensi[];
  belum_terpetakan: SubIdBelumTerpetakan[];
  /** Baris laporan yang tidak punya sub_id sama sekali. */
  tanpa_subid: { baris: number; komisi: number; klik: number };
  konten_tanpa_data: number;
  teratas: RingkasanKontenPerforma[];
  total: { komisi: number; klik: number; pesanan: number; baris_terpetakan: number };
}

interface Akumulasi {
  baris: number;
  komisi: number;
  komisi_cair: number;
  pesanan: Set<string>;
  klik: number;
  sub_ids: Set<string>;
}

function akumulasiBaru(): Akumulasi {
  return { baris: 0, komisi: 0, komisi_cair: 0, pesanan: new Set(), klik: 0, sub_ids: new Set() };
}

function tambahkan(akum: Akumulasi, baris: BarisPerforma, nomor: number): void {
  akum.baris += 1;
  akum.klik += baris.klik;
  if (baris.jenis === "klik") return;
  akum.komisi += baris.komisi;
  if (baris.status_kode !== "batal") akum.komisi_cair += baris.komisi;
  if (baris.status_kode !== "batal") {
    akum.pesanan.add(baris.id_pesanan.trim() !== "" ? baris.id_pesanan : `baris-${nomor}`);
  }
  const sub = normalkanSubId(baris.sub_id);
  if (sub !== "") akum.sub_ids.add(sub);
}

/**
 * Peta efektif = kode bawaan semua konten, ditimpa oleh pemetaan yang diisi
 * user. Peta user menang supaya kode lama (misalnya `threads-01`) tetap bisa
 * dipakai tanpa mengubah kontennya.
 */
export function petaEfektif(konten: Konten[], peta: PetaAtribusi["peta"]): Map<string, string> {
  const hasil = new Map<string, string>();
  for (const k of konten) hasil.set(normalkanSubId(subIdDefault(k.id)), k.id);
  for (const [sub, kontenId] of Object.entries(peta)) {
    const kunci = normalkanSubId(sub);
    if (kunci === "") continue;
    hasil.set(kunci, kontenId);
  }
  return hasil;
}

/** Konten yang dipakai menghitung: yang punya data, plus konten manual saja. */
function kontenRelevan(k: RingkasanKontenPerforma): boolean {
  return k.baris > 0 || k.klik_manual > 0;
}

/**
 * Group the mapped contents by one variable and total it up. Used for angle,
 * gaya hook, and letak link so "variabel mana yang paling banyak klik" is
 * answered with the same numbers everywhere (Fase 6, exit criteria). Content
 * with no data is filtered out by the caller before grouping.
 */
function kelompokkanDimensi(
  daftar: RingkasanKontenPerforma[],
  ambil: (k: RingkasanKontenPerforma) => { kunci: string; label: string },
): RingkasanDimensi[] {
  const mapa = new Map<
    string,
    { label: string; konten: Set<string>; komisi: number; komisiCair: number; pesanan: number; klik: number }
  >();

  for (const k of daftar) {
    const { kunci, label } = ambil(k);
    const akum =
      mapa.get(kunci) ??
      { label, konten: new Set<string>(), komisi: 0, komisiCair: 0, pesanan: 0, klik: 0 };
    // Nilai tak dikenal tetap dibawa apa adanya supaya tidak ada data yang hilang.
    if (!akum.label.trim()) akum.label = label;
    akum.konten.add(k.konten_id);
    akum.komisi += k.komisi;
    akum.komisiCair += k.komisi_cair;
    akum.pesanan += k.pesanan;
    akum.klik += k.klik_dipakai;
    mapa.set(kunci, akum);
  }

  return [...mapa.entries()]
    .map(([kunci, a]) => ({
      kunci,
      label: a.label,
      konten: a.konten.size,
      komisi: a.komisi,
      komisi_cair: a.komisiCair,
      pesanan: a.pesanan,
      klik: a.klik,
      konversi: a.klik > 0 ? (a.pesanan / a.klik) * 100 : 0,
    }))
    .sort((a, b) => b.komisi - a.komisi || a.label.localeCompare(b.label));
}

export function hitungAtribusi(
  baris: BarisPerforma[],
  konten: Konten[],
  peta: PetaAtribusi["peta"] = {},
): HasilAtribusi {
  const efektif = petaEfektif(konten, peta);
  const perKonten = new Map<string, Akumulasi>();
  const belum = new Map<string, Akumulasi>();
  const tanpa = akumulasiBaru();

  baris.forEach((b, i) => {
    const sub = normalkanSubId(b.sub_id);
    if (sub === "") {
      tambahkan(tanpa, b, i);
      return;
    }
    const kontenId = efektif.get(sub);
    const wadah = kontenId ? perKonten.get(kontenId) ?? akumulasiBaru() : belum.get(sub) ?? akumulasiBaru();
    tambahkan(wadah, b, i);
    if (kontenId) perKonten.set(kontenId, wadah);
    else belum.set(sub, wadah);
  });

  const daftar: RingkasanKontenPerforma[] = [];
  for (const k of konten) {
    const akum = perKonten.get(k.id) ?? akumulasiBaru();
    const klikDipakai = akum.klik > 0 ? akum.klik : k.klik_manual;
    daftar.push({
      konten_id: k.id,
      judul: k.judul,
      angle: k.ide_judul,
      gaya_hook: k.gaya_hook,
      letak_link: k.letak_link,
      produk_nama: k.produk_nama,
      status: k.status,
      sub_ids: [...akum.sub_ids].sort(),
      baris: akum.baris,
      komisi: akum.komisi,
      komisi_cair: akum.komisi_cair,
      pesanan: akum.pesanan.size,
      klik_impor: akum.klik,
      klik_manual: k.klik_manual,
      klik_dipakai: klikDipakai,
      komisi_per_klik: klikDipakai > 0 ? akum.komisi_cair / klikDipakai : 0,
      konversi: klikDipakai > 0 ? (akum.pesanan.size / klikDipakai) * 100 : 0,
    });
  }

  const per_konten = daftar
    .filter(kontenRelevan)
    .sort((a, b) => b.komisi - a.komisi || a.judul.localeCompare(b.judul));

  const idRelevan = new Set(per_konten.map((k) => k.konten_id));
  const konten_tanpa_data = konten.filter((k) => !idRelevan.has(k.id)).length;

  // Group per angle: konten yang memakai ide sama digabung supaya pola
  // "angle mana yang paling menghasilkan" bisa dibaca.
  const per_angle: RingkasanAngle[] = kelompokkanDimensi(per_konten, (k) => ({
    kunci: k.angle.trim() === "" ? "(tanpa angle)" : k.angle.trim(),
    label: k.angle.trim() === "" ? "(tanpa angle)" : k.angle.trim(),
  })).map((d) => ({
    angle: d.label,
    konten: d.konten,
    komisi: d.komisi,
    komisi_cair: d.komisi_cair,
    pesanan: d.pesanan,
    klik: d.klik,
    konversi: d.konversi,
  }));

  // A/B hook dan letak link (PRD F11): variabel yang sama, dihitung dari
  // konten yang sudah punya data saja supaya rata-rata tidak tertarik ke nol.
  const per_hook = kelompokkanDimensi(per_konten, (k) => ({
    kunci: k.gaya_hook,
    label: LABEL_GAYA_HOOK[k.gaya_hook] ?? k.gaya_hook,
  }));
  const per_letak_link = kelompokkanDimensi(per_konten, (k) => ({
    kunci: k.letak_link,
    label: LABEL_LETAK_LINK[k.letak_link] ?? k.letak_link,
  }));

  const belum_terpetakan: SubIdBelumTerpetakan[] = [...belum.entries()]
    .map(([sub_id, a]) => ({
      sub_id,
      baris: a.baris,
      komisi: a.komisi,
      klik: a.klik,
      pesanan: a.pesanan.size,
    }))
    .sort((a, b) => b.komisi - a.komisi);

  return {
    per_konten,
    per_angle,
    per_hook,
    per_letak_link,
    belum_terpetakan,
    tanpa_subid: { baris: tanpa.baris, komisi: tanpa.komisi, klik: tanpa.klik },
    konten_tanpa_data,
    teratas: per_konten.slice(0, 3),
    total: {
      komisi: per_konten.reduce((a, k) => a + k.komisi, 0),
      klik: per_konten.reduce((a, k) => a + k.klik_dipakai, 0),
      pesanan: per_konten.reduce((a, k) => a + k.pesanan, 0),
      baris_terpetakan: per_konten.reduce((a, k) => a + k.baris, 0),
    },
  };
}
