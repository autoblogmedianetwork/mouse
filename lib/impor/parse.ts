/**
 * Jembatan dari berkas ekspor marketplace ke baris performa internal.
 *
 * Alur: berkas → matriks teks (CSV/TSV atau XLSX) → deteksi marketplace →
 * peta kolom → baris tervalidasi Zod. Baris yang tidak lolos tidak
 * menggagalkan seluruh impor; alasannya dicatat agar user bisa memperbaiki
 * pemetaan kolom, bukan menebak.
 */
import { parseTabel, susunTabel, type Tabel } from "./csv";
import {
  deteksiMarketplace,
  kolomKurang,
  petakanKolom,
  type KolomInternal,
  type Marketplace,
  type PetaKolom,
} from "./marketplace";
import { bersihkanTeks, kanonikStatus, parseAngka, parsePersen, parseTanggal } from "./normalisasi";
import { buatIdBaris, kunciBaris } from "./performa";
import { barisPerformaSkema, hasilBacaSkema, type BarisDitolak, type HasilBaca } from "./skema";
import { bacaXlsx } from "./xlsx";

/** Batas aman: satu impor tidak boleh membuat localStorage kehabisan ruang. */
export const BATAS_BARIS_PER_IMPOR = 20_000;

export interface OpsiBaca {
  /** Nama berkas atau "tempel", muncul di jejak sumber. */
  nama?: string;
  /** User boleh memaksa marketplace bila deteksi otomatis salah. */
  marketplace?: Marketplace;
  /** Peta kolom manual: kolom internal → indeks header. */
  petaManual?: Partial<Record<KolomInternal, number>>;
}

function petaManualKePetaKolom(
  header: string[],
  petaManual: Partial<Record<KolomInternal, number>>,
): PetaKolom {
  const dipakai = new Set(Object.values(petaManual).filter((v): v is number => typeof v === "number"));
  return {
    peta: petaManual,
    dikenali: dipakai.size,
    takDikenali: header.filter((_, i) => !dipakai.has(i)),
    kurang: kolomKurang(petaManual),
  };
}

/** Ubah tabel (sudah berbentuk header + baris) menjadi hasil impor tervalidasi. */
export function bacaTabel(tabel: Tabel, opsi: OpsiBaca = {}): HasilBaca {
  const nama = opsi.nama ?? "tempel";
  const deteksi = deteksiMarketplace(tabel.header, nama);
  const marketplace: Marketplace = opsi.marketplace ?? deteksi.kode;
  const peta = opsi.petaManual
    ? petaManualKePetaKolom(tabel.header, opsi.petaManual)
    : petakanKolom(tabel.header, marketplace);

  const kosong: HasilBaca = {
    nama_sumber: nama,
    marketplace,
    skor_deteksi: opsi.marketplace ? deteksi.skor : deteksi.skor,
    alasan_deteksi: opsi.marketplace
      ? `Dipilih manual: ${marketplace}. Deteksi otomatis menyarankan ${deteksi.kode}.`
      : deteksi.alasan,
    pemisah: tabel.pemisah,
    baris_dilewati: tabel.baris_dilewati,
    header: tabel.header,
    peta: peta.peta as Record<string, number>,
    kolom_tak_dikenali: peta.takDikenali,
    kolom_kurang: peta.kurang as string[],
    baris: [],
    total_baris: tabel.baris.length,
    ditolak: [],
  };

  if (tabel.header.length === 0) return hasilBacaSkema.parse(kosong);
  if (peta.kurang.length > 0) return hasilBacaSkema.parse(kosong);

  const baris: HasilBaca["baris"] = [];
  const ditolak: BarisDitolak[] = [];
  const diimporPada = new Date().toISOString();

  for (let i = 0; i < tabel.baris.length; i += 1) {
    const nomor = i + 1;
    if (i >= BATAS_BARIS_PER_IMPOR) {
      ditolak.push({ nomor, alasan: `melebihi batas ${BATAS_BARIS_PER_IMPOR} baris per impor` });
      continue;
    }

    const kolom = tabel.baris[i];
    const ambil = (k: KolomInternal): string => {
      const idx = peta.peta[k];
      return idx === undefined ? "" : bersihkanTeks(kolom[idx] ?? "");
    };

    const produk = ambil("produk");
    const idPesanan = ambil("id_pesanan");
    const komisi = parseAngka(ambil("komisi"));
    const klik = parseAngka(ambil("klik"));

    if (produk === "" && idPesanan === "") {
      ditolak.push({ nomor, alasan: "nama produk dan ID pesanan kosong" });
      continue;
    }
    // Baris penjualan butuh komisi; baris dari ekspor analitik cukup punya klik.
    const jenis: "penjualan" | "klik" = komisi !== null ? "penjualan" : "klik";
    if (komisi === null && (klik === null || klik <= 0)) {
      ditolak.push({ nomor, alasan: "komisi dan klik tidak terbaca sebagai angka" });
      continue;
    }

    const statusMentah = ambil("status_pesanan");
    const jumlah = parseAngka(ambil("jumlah"));
    const harga = parseAngka(ambil("harga"));
    const kandidat = {
      id: "",
      marketplace,
      jenis,
      id_pesanan: idPesanan,
      produk,
      varian: ambil("varian"),
      tanggal: parseTanggal(ambil("tanggal")),
      jumlah: jumlah === null || jumlah <= 0 ? 1 : jumlah,
      harga: jenis === "penjualan" ? harga ?? 0 : 0,
      komisi: komisi ?? 0,
      tingkat_komisi: parsePersen(ambil("tingkat_komisi")),
      status_pesanan: statusMentah,
      status_kode: kanonikStatus(statusMentah),
      sub_id: ambil("sub_id"),
      klik: klik === null || klik <= 0 ? 0 : klik,
      sumber: nama,
      diimpor_pada: diimporPada,
    };
    kandidat.id = buatIdBaris(kunciBaris(kandidat));

    const valid = barisPerformaSkema.safeParse(kandidat);
    if (!valid.success) {
      ditolak.push({ nomor, alasan: valid.error.issues[0]?.message ?? "baris tidak valid" });
      continue;
    }
    baris.push(valid.data);
  }

  return hasilBacaSkema.parse({ ...kosong, baris, ditolak });
}

/** Jalur tempel teks: user boleh menempel langsung isi laporan. */
export function bacaTeks(teks: string, opsi: OpsiBaca = {}): HasilBaca {
  return bacaTabel(parseTabel(teks), opsi);
}

/**
 * Jalur berkas. .xlsx dibaca sebagai ZIP + XML, sisanya sebagai teks
 * (CSV/TSV/TXT). .xls lama ditolak dengan pesan yang bisa ditindaklanjuti.
 *
 * Tabel dikembalikan terpisah supaya UI bisa memetakan ulang kolom tanpa
 * membaca berkasnya dua kali.
 */
export async function bacaBerkasKeTabel(file: File): Promise<Tabel> {
  const nama = file.name || "berkas";
  const ekstensi = nama.toLowerCase().split(".").pop() ?? "";

  if (ekstensi === "xls") {
    throw new Error(
      "Format .xls lama belum didukung. Di Excel, pilih Save As → .xlsx atau CSV, lalu unggah lagi.",
    );
  }
  if (ekstensi === "xlsx" || ekstensi === "xlsm") {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return susunTabel(await bacaXlsx(bytes), "xlsx");
  }
  if (ekstensi === "zip") {
    throw new Error("Berkas .zip tidak dibaca langsung. Ekstrak dulu, lalu unggah .xlsx atau .csv-nya.");
  }

  return parseTabel(await file.text());
}

/** Baca berkas menjadi hasil impor siap pakai. */
export async function bacaBerkas(file: File, opsi: OpsiBaca = {}): Promise<HasilBaca> {
  const tabel = await bacaBerkasKeTabel(file);
  return bacaTabel(tabel, { ...opsi, nama: file.name || "berkas" });
}
