/**
 * Peta kolom dan deteksi marketplace.
 *
 * Tiga marketplace punya nama kolom berbeda untuk hal yang sama: Shopee
 * memakai "ID Pesanan" dan "Sub_id", TikTok Shop memakai "Order ID" dan
 * "Order created time", Tokopedia memakai "No. Pesanan" dan "Total Komisi".
 * Peta alias ini yang menjembatani semuanya (Workflow bagian 6). Jalur generik
 * tetap ada supaya format baru tidak memblokir impor.
 */

export type Marketplace = "shopee" | "tiktok" | "tokopedia" | "lainnya";

export const MARKETPLACE_LABEL: Record<Marketplace, string> = {
  shopee: "Shopee Affiliate",
  tiktok: "TikTok Shop Affiliate",
  tokopedia: "Tokopedia Affiliate",
  lainnya: "Format generik",
};

export type KolomInternal =
  | "id_pesanan"
  | "produk"
  | "varian"
  | "tanggal"
  | "jumlah"
  | "harga"
  | "komisi"
  | "tingkat_komisi"
  | "status_pesanan"
  | "sub_id"
  | "klik";

/** Kolom yang harus ada sebelum baris bisa dibaca. */
export const KOLOM_WAJIB: KolomInternal[] = ["produk"];

export const KOLOM_LABEL: Record<KolomInternal, string> = {
  id_pesanan: "ID pesanan",
  produk: "Nama produk",
  varian: "Varian / SKU",
  tanggal: "Tanggal pesanan",
  jumlah: "Jumlah",
  harga: "Nilai pesanan (GMV)",
  komisi: "Komisi",
  tingkat_komisi: "Tingkat komisi",
  status_pesanan: "Status pesanan",
  sub_id: "Sub ID / kanal",
  klik: "Klik",
};

/** Alias umum, dipakai semua marketplace termasuk format generik. */
const ALIAS_UMUM: Record<KolomInternal, string[]> = {
  id_pesanan: [
    "orderid",
    "idpesanan",
    "nopesanan",
    "nomorpesanan",
    "kodepesanan",
    "ordernumber",
    "transactionid",
    "idtransaksi",
    "invoice",
    "pesanan",
  ],
  produk: [
    "namaproduk",
    "produk",
    "productname",
    "product",
    "namaitem",
    "itemname",
    "judulproduk",
    "producttitle",
    "item",
  ],
  varian: ["varian", "variasi", "variant", "skuname", "sku", "productoption", "namavarian"],
  tanggal: [
    "tanggalpesanan",
    "waktupesanan",
    "orderdate",
    "ordertime",
    "ordercreatedtime",
    "createdtime",
    "tanggaltransaksi",
    "waktudibuat",
    "tanggaldibuat",
    "createdat",
    "tanggal",
    "date",
  ],
  jumlah: ["jumlah", "qty", "quantity", "kuantitas", "jumlahitem", "units", "unitsterjual"],
  harga: [
    "nilaipesanan",
    "hargaproduk",
    "totalpembayaran",
    "ordervalue",
    "orderamount",
    "totalharga",
    "totaltransaksi",
    "subtotal",
    "grandtotal",
    "amount",
    "gmv",
    "harga",
    "total",
  ],
  komisi: [
    "totalkomisi",
    "komisiaffiliate",
    "komisikotor",
    "estimasikomisi",
    "estimatedcommission",
    "commissionamount",
    "totalcommission",
    "komisiestimasi",
    "komisiakhir",
    "commission",
    "komisi",
  ],
  tingkat_komisi: ["tingkatkomisi", "persenkomisi", "komisipers", "commissionrate", "rate"],
  status_pesanan: [
    "statuspesanan",
    "orderstatus",
    "statustransaksi",
    "statuspembayaran",
    "paymentstatus",
    "ordersubstatus",
    "statusorder",
    "status",
  ],
  sub_id: ["subid", "subid1", "subid2", "channel", "kanal", "sumber", "trackingid"],
  klik: [
    "klik",
    "clicks",
    "click",
    "jumlahklik",
    "totalklik",
    "productclicks",
    "itemclicks",
    "uniqueclicks",
    "clickcount",
  ],
};

/** Alias khas satu marketplace: dipakai untuk deteksi, bukan hanya pemetaan. */
const ALIAS_KHAS: Record<Exclude<Marketplace, "lainnya">, Partial<Record<KolomInternal, string[]>>> = {
  shopee: {
    id_pesanan: ["idpesanan", "kodeorder"],
    sub_id: ["subid", "subid1", "subid2"],
    komisi: ["komisiaffiliate", "komisikotor"],
    tingkat_komisi: ["komisipers", "persenkomisi"],
    harga: ["nilaipesanan"],
  },
  tiktok: {
    id_pesanan: ["orderid"],
    varian: ["skuid"],
    tanggal: ["ordercreatedtime"],
    komisi: ["estimatedcommission", "commissionamount"],
    tingkat_komisi: ["commissionrate"],
    status_pesanan: ["orderstatus", "ordersubstatus"],
    harga: ["orderamount"],
    sub_id: ["creator", "creatorusername"],
  },
  tokopedia: {
    id_pesanan: ["nopesanan"],
    komisi: ["totalkomisi"],
    tanggal: ["tanggaldibuat", "tanggalpesanan"],
    harga: ["totalpembayaran", "nilaipesanan"],
    status_pesanan: ["statuspesanan"],
  },
};

const PETUNJUK_NAMA_BERKAS: Record<Exclude<Marketplace, "lainnya">, string[]> = {
  shopee: ["shopee", "spr", "komisi_shopee"],
  tiktok: ["tiktok", "ttshop", "tt_", "tiktokshop"],
  tokopedia: ["tokopedia", "tokped", "tp_"],
};

/** "No. Pesanan" → "nopesanan", "Sub_id" → "subid", "Commission Rate" → "commissionrate". */
export function normalisasiHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9]/g, "");
}

export interface DeteksiMarketplace {
  kode: Marketplace;
  /** Skor kecocokan; makin tinggi makin yakin. */
  skor: number;
  /** Alasan singkat untuk ditampilkan di UI. */
  alasan: string;
  /** Peringkat semua kandidat, dipakai saat user ingin memilih manual. */
  kandidat: Array<{ kode: Marketplace; skor: number }>;
}

export function deteksiMarketplace(header: string[], namaBerkas = ""): DeteksiMarketplace {
  const kolom = header.map(normalisasiHeader).filter(Boolean);
  const nama = namaBerkas.toLowerCase();

  const kandidat = (Object.keys(ALIAS_KHAS) as Array<Exclude<Marketplace, "lainnya">>).map((kode) => {
    const khas = ALIAS_KHAS[kode];
    const cocok = new Set<string>();
    for (const [intern, daftar] of Object.entries(khas) as Array<[KolomInternal, string[]]>) {
      for (const alias of daftar) {
        if (kolom.some((k) => k === alias)) {
          cocok.add(`${intern}:${alias}`);
        }
      }
    }
    const petunjuk = PETUNJUK_NAMA_BERKAS[kode].some((p) => nama.includes(p));
    return { kode, skor: cocok.size * 2 + (petunjuk ? 3 : 0), cocok: cocok.size, petunjuk };
  });

  const urut = [...kandidat].sort((a, b) => b.skor - a.skor);
  const teratas = urut[0];
  const kode: Marketplace = teratas && teratas.skor >= 2 ? teratas.kode : "lainnya";
  const detail = kandidat.find((k) => k.kode === kode);

  return {
    kode,
    skor: kode === "lainnya" ? 0 : teratas.skor,
    alasan:
      kode === "lainnya"
        ? "Nama kolom tidak menyerupai tiga format marketplace yang dikenal."
        : `${detail?.cocok ?? 0} kolom khas ${MARKETPLACE_LABEL[kode]}${detail?.petunjuk ? " dan nama berkas cocok" : ""}.`,
    kandidat: urut.map(({ kode: k, skor }) => ({ kode: k, skor })),
  };
}

export interface PetaKolom {
  /** Kolom internal → indeks kolom di header. */
  peta: Partial<Record<KolomInternal, number>>;
  /** Jumlah kolom yang berhasil dipetakan. */
  dikenali: number;
  /** Header yang tidak masuk kolom mana pun. */
  takDikenali: string[];
  /** Kolom wajib yang belum ketemu. */
  kurang: KolomInternal[];
}

function aliasUntuk(intern: KolomInternal, kode: Marketplace): string[] {
  const khas = kode === "lainnya" ? [] : (ALIAS_KHAS[kode][intern] ?? []);
  return [...new Set([...khas, ...ALIAS_UMUM[intern]])];
}

/**
 * Petakan header mentah ke kolom internal. Cocok persis diutamakan; kalau tidak
 * ada, alias panjang (>= 6 huruf) boleh cocok sebagai bagian dari nama kolom.
 */
export function petakanKolom(header: string[], kode: Marketplace): PetaKolom {
  const normal = header.map(normalisasiHeader);
  const dipakai = new Set<number>();
  const peta: Partial<Record<KolomInternal, number>> = {};

  for (const intern of Object.keys(ALIAS_UMUM) as KolomInternal[]) {
    const alias = aliasUntuk(intern, kode);
    let idx = normal.findIndex((n, i) => !dipakai.has(i) && n.length > 0 && alias.includes(n));
    if (idx < 0) {
      idx = normal.findIndex(
        (n, i) =>
          !dipakai.has(i) &&
          n.length >= 6 &&
          alias.some((a) => a.length >= 6 && (n.includes(a) || a.includes(n))),
      );
    }
    if (idx >= 0) {
      peta[intern] = idx;
      dipakai.add(idx);
    }
  }

  const takDikenali = header.filter((h, i) => !dipakai.has(i) && normalisasiHeader(h) !== "");

  return { peta, dikenali: Object.keys(peta).length, takDikenali, kurang: kolomKurang(peta) };
}

/**
 * Kolom minimal supaya impor berguna: nama produk, dan salah satu dari komisi
 * atau klik. Ekspor analitik marketplace kadang hanya memuat klik tanpa komisi,
 * dan itu tetap berguna untuk mengukur konversi.
 */
export function kolomKurang(peta: Partial<Record<KolomInternal, number>>): KolomInternal[] {
  const kurang: KolomInternal[] = [];
  if (peta.produk === undefined) kurang.push("produk");
  if (peta.komisi === undefined && peta.klik === undefined) kurang.push("komisi");
  return kurang;
}

/** Daftar kolom internal yang bisa dipilih user saat memetakan manual. */
export const PILIHAN_KOLOM: Array<{ nilai: KolomInternal; label: string }> = (
  Object.keys(KOLOM_LABEL) as KolomInternal[]
).map((nilai) => ({ nilai, label: KOLOM_LABEL[nilai] }));

/** Peta kosong untuk mode "petakan sendiri". */
export function petaKosong(): PetaKolom {
  return { peta: {}, dikenali: 0, takDikenali: [], kurang: [...KOLOM_WAJIB, "komisi"] as KolomInternal[] };
}
