/**
 * Bank Balasan (riset 17 Nov + bank ide) — template balasan dalam suara
 * Pak Slem untuk dipakai saat mampir di postingan orang lain.
 *
 * Kenapa ini penting: balasan menyumbang >50% views di Threads (riset
 * contentstudio/kingfin) — ini tuas pertumbuhan terbesar, dan pemula
 * selalu bingung "mau bales apa". Semua template manual: disalin, lalu
 * user menyesuaikan dengan konteks postingan yang dibalas. Tidak ada
 * pengiriman otomatis (Fase 4).
 *
 * Aturan suara (catatan 11 — Persona Pak Slem): bapak dua anak, sopan,
 * suka bercerita, memakai "saya", tidak menggurui, tidak menjual keras.
 * Placeholder [topik] wajib diganti user sebelum dipakai.
 */

export type SituasiBalasan = {
  id: string;
  situasi: string;
  kapan: string;
  templat: string[];
};

export const BANK_BALASAN: readonly SituasiBalasan[] = [
  {
    id: "setuju-pengalaman",
    situasi: "Setuju + tambah pengalaman",
    kapan: "Orang cerita masalah yang pernah saya alami juga.",
    templat: [
      "Saya dulu persis kayak gitu [topik]. Yang akhirnya membantu saya: [pengalaman singkat]. Semoga membantu juga buat kamu.",
      "Setuju banget soal [topik]. Di rumah saya solusinya sederhana aja: [pengalaman singkat]. Alhamdulillah nggak perlu yang mahal.",
    ],
  },
  {
    id: "bertanya-balik",
    situasi: "Bertanya balik (membuka percakapan)",
    kapan: "Mau lanjut obrolan, bukan sekadar sopan santun.",
    templat: [
      "Menarik nih soal [topik]. Boleh tahu, kamu lebih condong ke [pilihan A] atau [pilihan B]? Saya penasaran pengalaman orang lain.",
      "Saya pernah bingung juga di [topik]. Kalau boleh tahu, yang jadi pertimbangan utamamu apa — harga, ketahanan, atau kemudahannya?",
    ],
  },
  {
    id: "berbagi-tips",
    situasi: "Berbagi tips singkat",
    kapan: "Ada tips kecil yang benar-benar pernah saya pakai.",
    templat: [
      "Tips kecil dari pengalaman saya soal [topik]: [tips]. Simpel tapi lumayan membantu.",
      "Kalau boleh berbagi, untuk [topik] saya biasanya [tips]. Semoga cocok juga dengan kondisimu.",
    ],
  },
  {
    id: "empati",
    situasi: "Empati (orang keluhan/kecewa)",
    kapan: "Orang keluhan — dengarkan dulu, jangan tawarkan barang.",
    templat: [
      "Wah, itu pasti nyebelin banget. Saya pernah ngalamin serupa di [topik], sabar ya semoga cepat selesai.",
      "Sabar ya. Kalau boleh cerita, [topik]-nya bermasalah di bagian mana? Siapa tahu pengalaman saya bisa bantu sedikit.",
    ],
  },
  {
    id: "ditanya-harga",
    situasi: "Ditanya harga/link (paling sering!)",
    kapan: "Ada yang tertarik dan bertanya di kolom balasan.",
    templat: [
      "Wah terima kasih sudah tertarik! Link dan harganya saya taruh di balasan atas ya, biar rapi — ada promo juga hari ini.",
      "Boleh! Detail harga dan linknya saya tulis di balasan postingan saya ya. Kalau ada yang mau ditanyakan lagi, silakan — senang bantu.",
    ],
  },
  {
    id: "ujar-terima-kasih",
    situasi: "Membalas pujian/terima kasih",
    kapan: "Orang berterima kasih atau memuji konten.",
    templat: [
      "Terima kasih sudah mampir! Senang sekali kalau bermanfaat untuk kamu. Kalau nanti ada yang mau ditanyakan lagi, tinggal balas saja ya — saya senang bantu.",
      "Alhamdulillah kalau membantu. Doakan saya tetap semangat bikin konten yang bermanfaat ya!",
    ],
  },
] as const;

/** Jumlah template balasan yang tersedia (dipakai UI untuk ringkasan). */
export function jumlahTemplateBalasan(): number {
  return BANK_BALASAN.reduce((total, s) => total + s.templat.length, 0);
}
