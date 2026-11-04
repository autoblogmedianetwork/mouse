/**
 * Kerangka penulisan konten (urutan isi), terpisah dari `gaya_hook`.
 *
 * `gaya_hook` menjawab "bagaimana status pertama dibuka"; `kerangka`
 * menjawab "bagian mana yang muncul lebih dulu dan bagaimana isinya
 * berurutan". Keduanya bisa dikombinasikan, dan masing-masing konten
 * menyimpan pilihannya supaya klik dan komisi bisa dibandingkan per kerangka.
 *
 * Daftar ini sengaja berupa data, bukan if-else di prompt builder: menambah
 * kerangka baru cukup satu entri, dan label UI ikut dari sini.
 */

export const KERANGKA_IDS = ["bebas", "psc", "aida", "pas", "bab", "hbsc", "msspc"] as const;

export type KerangkaId = (typeof KERANGKA_IDS)[number];

export const LABEL_KERANGKA: Record<KerangkaId, string> = {
  bebas: "Bebas (tanpa kerangka)",
  psc: "PSC — Problem, Solution, CTA",
  aida: "AIDA — Attention, Interest, Desire, Action",
  pas: "PAS — Problem, Agitate, Solution",
  bab: "BAB — Before, After, Bridge",
  hbsc: "HBSC — Hook, Benefit, Social Proof, CTA",
  msspc: "MSSPC — Masalah, Situasi, Solusi, Pertimbangan, CTA",
};

/** Keterangan singkat untuk UI: kapan kerangka ini cocok. */
export const KETERANGAN_KERANGKA: Record<KerangkaId, string> = {
  bebas: "AI memilih urutan sendiri; gaya hook tetap dipakai.",
  psc: "Produk yang menyelesaikan masalah sehari-hari.",
  aida: "Produk yang butuh dorongan checkout.",
  pas: "Masalah yang makin berat kalau dibiarkan.",
  bab: "Produk yang hasil akhirnya mudah dibayangkan.",
  hbsc: "Produk yang sudah punya bukti nyata (ulasan atau angka penjualan).",
  msspc: "Alur mengobrol: masalah, situasi, solusi, lalu pertimbangan sebelum beli.",
};

const ATURAN_KERANGKA = `Cara memakai kerangka:
- Kerangka mengatur URUTAN ISI, bukan pengganti hook. Status pertama tetap memakai gaya hook yang diminta di atas.
- Bagikan bagian kerangka secara berurutan dari status pertama sampai status terakhir. Satu bagian boleh lebih dari satu status, dan tidak setiap bagian perlu satu status sendiri.
- Jangan menyebut nama bagiannya di dalam teks ("Attention:", "Solusi:", dan sebagainya); pembaca hanya melihat tulisan yang mengalir.
- Jangan memancing interaksi dengan pertanyaan kosong seperti "beda banget kan?" atau "kelihatan kaku banget kan". Pertanyaan reflektif boleh, tetapi maksimal satu dan tidak boleh jadi pola tetap.
- Semua fakta (harga, bahan, kekurangan, hasil) hanya dari data penawaran di atas. Bagian yang butuh data yang tidak ada dilewati, bukan dikarang.`;

const BAGIAN: Record<Exclude<KerangkaId, "bebas">, string> = {
  psc: `- Problem: masalah atau kebutuhan nyata yang dirasakan audiens.
- Solution: bagaimana penawaran ini menjawabnya, dalam bahasa pemakaian sehari-hari.
- CTA: ajakan yang natural, tanpa memaksa checkout.`,

  aida: `- Attention: pembuka yang menghentikan gulir.
- Interest: fakta atau situasi yang membuat pembaca ingin tahu lebih jauh.
- Desire: bayangan hasil setelah memakai penawaran ini, tanpa melebih-lebihkan.
- Action: langkah berikutnya yang jelas tetapi tidak mendesak.`,

  pas: `- Problem: masalah yang dialami audiens.
- Agitate: perjelas apa yang terjadi kalau masalah itu dibiarkan (tanpa menakut-nakuti dan tanpa fakta karangan).
- Solution: penawaran ini sebagai jalan keluarnya.`,

  bab: `- Before: kondisi sebelum memakai penawaran ini.
- After: kondisi sesudahnya, realistis dan bisa dibayangkan.
- Bridge: bagaimana penawaran ini menjadi jembatan dari Before ke After.`,

  hbsc: `- Hook: pembuka yang menghentikan gulir.
- Benefit: manfaat utama yang dirasakan pembaca.
- Social Proof: HANYA bukti yang benar-benar ada di data penawaran, misalnya ulasan yang sudah tercatat atau jumlah terjual yang diisi user. Kalau data itu tidak ada, LEWATI bagian ini dan jangan mengarang angka, rating, atau testimoni.
- CTA: ajakan natural.`,

  msspc: `- Masalah: keluhan yang audiens akui sendiri.
- Situasi: kapan masalah itu muncul dalam keseharian (pagi buru-buru, akhir bulan, saat anak rewel).
- Solusi: penawaran ini dan cara pakainya.
- Pertimbangan: bantu pembaca menilai sendiri — untuk siapa cocok, untuk siapa kurang cocok, batasan yang jujur. Ini bukan bagian jualan, jadi jangan diubah jadi pujian.
- CTA: ajakan natural setelah pembaca punya cukup informasi.`,
};

/** Nilai tak dikenal (draf lama, jsonb liar) jatuh ke "bebas". */
export function kerangkaDariNilai(nilai: unknown): KerangkaId {
  return typeof nilai === "string" && (KERANGKA_IDS as readonly string[]).includes(nilai)
    ? (nilai as KerangkaId)
    : "bebas";
}

/**
 * Blok prompt untuk kerangka terpilih. String kosong untuk `bebas`, supaya
 * prompt tetap sama seperti v5 dan tidak ada instruksi urutan yang dipaksakan.
 */
export function instruksiKerangka(kerangka: KerangkaId): string {
  if (kerangka === "bebas") return "";
  return `KERANGKA PENULISAN: ${LABEL_KERANGKA[kerangka]}

${BAGIAN[kerangka]}

${ATURAN_KERANGKA}`;
}
