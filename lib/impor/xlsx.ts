/**
 * Pembaca .xlsx tanpa dependency.
 *
 * Ekspor Shopee Affiliate, TikTok Shop Affiliate, dan Tokopedia Affiliate
 * umumnya berupa .xlsx, bukan .csv. Alih-alih menambah library (AGENTS rule 3),
 * file .xlsx dibaca langsung: formatnya ZIP, dan di dalamnya ada XML worksheet.
 * ZIP dibuka sendiri (central directory + DecompressionStream), lalu sheet
 * diubah menjadi matriks teks.
 *
 * Catatan: .xls (format lama, bukan ZIP) tidak didukung. Untuk file seperti itu
 * user diminta menyimpan ulang sebagai .xlsx atau .csv.
 */

const SIG_EOCD = 0x06054b50;
const SIG_CD = 0x02014b50;
const SIG_LOKAL = 0x04034b50;

export interface EntriZip {
  nama: string;
  metode: number;
  ukuranMampat: number;
  offsetLokal: number;
}

function keArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function bacaUint16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function bacaUint32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

/** Daftar isi ZIP dari End of Central Directory + central directory. */
export function daftarEntriZip(bytes: Uint8Array): EntriZip[] {
  const batasAwal = Math.max(0, bytes.length - 66_000);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= batasAwal; i -= 1) {
    if (bacaUint32(bytes, i) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Berkas bukan .xlsx yang valid (ZIP tidak ditemukan).");

  const jumlah = bacaUint16(bytes, eocd + 10);
  let pos = bacaUint32(bytes, eocd + 16);
  const entri: EntriZip[] = [];

  for (let i = 0; i < jumlah; i += 1) {
    if (pos + 46 > bytes.length || bacaUint32(bytes, pos) !== SIG_CD) break;
    const metode = bacaUint16(bytes, pos + 10);
    const ukuranMampat = bacaUint32(bytes, pos + 20);
    const panjangNama = bacaUint16(bytes, pos + 28);
    const panjangExtra = bacaUint16(bytes, pos + 30);
    const panjangKomentar = bacaUint16(bytes, pos + 32);
    const offsetLokal = bacaUint32(bytes, pos + 42);
    const nama = new TextDecoder("utf-8").decode(
      bytes.subarray(pos + 46, pos + 46 + panjangNama),
    );
    entri.push({ nama, metode, ukuranMampat, offsetLokal });
    pos += 46 + panjangNama + panjangExtra + panjangKomentar;
  }

  return entri;
}

/** Dekompresi deflate-raw; tersedia di browser modern dan Node 18+. */
export async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error(
      "Peramban ini belum bisa membaca .xlsx. Simpan ekspor sebagai CSV lalu unggah lagi.",
    );
  }
  const stream = new Blob([keArrayBuffer(data)])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Isi satu entri ZIP (metode 0 disalin apa adanya, metode 8 di-inflate). */
export async function bacaIsiEntri(bytes: Uint8Array, entri: EntriZip): Promise<Uint8Array> {
  const p = entri.offsetLokal;
  if (bacaUint32(bytes, p) !== SIG_LOKAL) {
    throw new Error(`Struktur ZIP rusak pada entri ${entri.nama}.`);
  }
  const panjangNama = bacaUint16(bytes, p + 26);
  const panjangExtra = bacaUint16(bytes, p + 28);
  const mulai = p + 30 + panjangNama + panjangExtra;
  const mampat = bytes.subarray(mulai, mulai + entri.ukuranMampat);
  if (entri.metode === 0) return mampat;
  if (entri.metode === 8) return inflateRaw(mampat);
  throw new Error(`Kompresi ZIP tidak didukung (metode ${entri.metode}).`);
}

/** Semua entri teks (XML) yang dibutuhkan pembaca sheet. */
export async function bacaXmlZip(bytes: Uint8Array): Promise<Map<string, string>> {
  const entri = daftarEntriZip(bytes);
  const perlu = entri.filter(
    (e) =>
      e.nama === "xl/workbook.xml" ||
      e.nama === "xl/sharedStrings.xml" ||
      e.nama === "xl/styles.xml" ||
      /^xl\/worksheets\/sheet\d+\.xml$/.test(e.nama),
  );
  const hasil = new Map<string, string>();
  for (const e of perlu) {
    const isi = await bacaIsiEntri(bytes, e);
    hasil.set(e.nama, new TextDecoder("utf-8").decode(isi));
  }
  return hasil;
}

const ENTITAS: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function uraiEntitas(teks: string): string {
  return teks.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (utuh, kode: string) => {
    if (kode.startsWith("#x") || kode.startsWith("#X")) {
      const n = Number.parseInt(kode.slice(2), 16);
      return Number.isNaN(n) ? utuh : String.fromCodePoint(n);
    }
    if (kode.startsWith("#")) {
      const n = Number.parseInt(kode.slice(1), 10);
      return Number.isNaN(n) ? utuh : String.fromCodePoint(n);
    }
    return ENTITAS[kode] ?? utuh;
  });
}

function indeksKolom(referensi: string): number {
  const huruf = referensi.match(/^[A-Za-z]+/)?.[0] ?? "";
  let kolom = 0;
  for (const c of huruf.toUpperCase()) {
    kolom = kolom * 26 + (c.charCodeAt(0) - 64);
  }
  return Math.max(0, kolom - 1);
}

/** Teks di dalam <si> atau <is>, digabung dari semua <t>. */
function ambilTeks(blok: string): string {
  const bagian = [...blok.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]);
  if (bagian.length === 0) return "";
  return uraiEntitas(bagian.join(""));
}

/** Indeks gaya sel yang berformat tanggal, agar angka serial jadi tanggal. */
function gayaTanggal(xmlStyles: string | undefined): Set<number> {
  const hasil = new Set<number>();
  if (!xmlStyles) return hasil;

  const formatKhusus = new Map<number, string>();
  const blokNumFmt = xmlStyles.match(/<numFmts[\s\S]*?<\/numFmts>/)?.[0] ?? "";
  for (const m of blokNumFmt.matchAll(/<numFmt[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g)) {
    formatKhusus.set(Number(m[1]), uraiEntitas(m[2]));
  }

  const tanggalBawaan = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);
  const blokXf = xmlStyles.match(/<cellXfs[\s\S]*?<\/cellXfs>/)?.[0] ?? "";
  let indeks = 0;
  for (const m of blokXf.matchAll(/<xf\b[^>]*>/g)) {
    const numFmtId = Number(m[0].match(/numFmtId="(\d+)"/)?.[1] ?? 0);
    const kode = formatKhusus.get(numFmtId)?.replace(/"[\s\S]*?"/g, "").replace(/\[[^\]]*\]/g, "") ?? "";
    const miripTanggal =
      tanggalBawaan.has(numFmtId) || (/[ymd]/i.test(kode) && !/^general$/i.test(kode.trim()));
    const miripPersen = numFmtId === 9 || numFmtId === 10 || kode.includes("%");
    if (miripTanggal) hasil.add(indeks);
    else if (miripPersen) hasil.add(-indeks - 1); // penanda persen
    indeks += 1;
  }
  return hasil;
}

/**
 * Ubah bytes .xlsx menjadi matriks teks. Sheet pertama yang dipakai, karena
 * ekspor marketplace selalu satu sheet.
 */
export async function bacaXlsx(bytes: Uint8Array): Promise<string[][]> {
  const xml = await bacaXmlZip(bytes);

  const namaSheet = [...xml.keys()]
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = Number(a.match(/(\d+)/)?.[1] ?? 0);
      const nb = Number(b.match(/(\d+)/)?.[1] ?? 0);
      return na - nb;
    })[0];
  if (!namaSheet) throw new Error("Tidak ada worksheet di dalam berkas .xlsx ini.");

  const shared = (xml.get("xl/sharedStrings.xml") ?? "").match(/<si>[\s\S]*?<\/si>/g) ?? [];
  const sharedTeks = shared.map(ambilTeks);
  const gaya = gayaTanggal(xml.get("xl/styles.xml"));
  const sheet = xml.get(namaSheet) ?? "";

  const baris: string[][] = [];
  for (const m of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>|<row[^>]*\/>/g)) {
    const isi = m[1] ?? "";
    const keluaran: string[] = [];
    let kolomBerikut = 0;

    for (const c of isi.matchAll(/<c\b([^>]*?)\/>|<c\b([^>]*?)>([\s\S]*?)<\/c>/g)) {
      const atribut = c[1] ?? c[2] ?? "";
      const dalam = c[3] ?? "";
      const ref = atribut.match(/r="([A-Za-z]+\d+)"/)?.[1];
      const tipe = atribut.match(/t="([^"]+)"/)?.[1] ?? "n";
      const gayaSel = Number(atribut.match(/s="(\d+)"/)?.[1] ?? -1);
      const kolom = ref ? indeksKolom(ref) : kolomBerikut;
      kolomBerikut = kolom + 1;

      let nilai = "";
      if (tipe === "s") {
        const idx = Number(dalam.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? -1);
        nilai = sharedTeks[idx] ?? "";
      } else if (tipe === "inlineStr") {
        nilai = ambilTeks(dalam);
      } else if (tipe === "b") {
        nilai = dalam.includes("<v>1</v>") ? "TRUE" : "FALSE";
      } else if (tipe === "e") {
        nilai = "";
      } else {
        const v = dalam.match(/<v>([\s\S]*?)<\/v>/)?.[1];
        if (v === undefined) {
          nilai = "";
        } else if (gayaSel >= 0 && gaya.has(gayaSel)) {
          nilai = serialKeIso(Number(v));
        } else if (gayaSel >= 0 && gaya.has(-gayaSel - 1)) {
          nilai = `${Number(v) * 100}`;
        } else {
          nilai = uraiEntitas(v);
        }
      }

      while (keluaran.length < kolom) keluaran.push("");
      keluaran[kolom] = nilai;
    }

    baris.push(keluaran);
  }

  // Buang baris kosong di ujung supaya header bisa dideteksi dengan benar.
  while (baris.length > 0 && baris[baris.length - 1].every((s) => s.trim() === "")) baris.pop();
  return baris;
}

/** Salinan kecil dari normalisasi.serialKeIso untuk menghindari impor melingkar. */
function serialKeIso(serial: number): string {
  const epoch = Date.UTC(1899, 11, 30);
  const d = new Date(epoch + Math.round(serial) * 86_400_000);
  return `${d.getUTCFullYear()}-${`${d.getUTCMonth() + 1}`.padStart(2, "0")}-${`${d.getUTCDate()}`.padStart(2, "0")}`;
}
