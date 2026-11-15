/**
 * Prompt 3 — generate status, versi v8 (lima gaya hook baru + Mini Story
 * Telling via kerangka "cerita").
 *
 * Hubungan dengan versi lama (AGENTS rule 13):
 * - v4 tidak bisa menerima gaya hook baru tanpa mengubah isinya, jadi v8
 *   MENGGANDOKAN builder v4 secara utuh dan menambah 5 instruksi hook baru
 *   (educative, fomo_lembut, negative_stop, urgensi_rasional,
 *   pengalaman_nyata) dari file referensi user "Contoh Prompt natural".
 * - Untuk ketujuh hook lama, teks instruksi disalin PERSIS dari v4, sehingga
 *   output v8 identik dengan v7 (dibuktikan test regresi).
 * - Kerangka "cerita" (Mini Story Telling) datang dari lib/ai/kerangka.ts,
 *   bukan dari file ini.
 *
 * Susunan blok mengikuti v7: dasar (v4) → ATURAN_BAHASA → kerangka →
 * ATURAN_ANTI_TERJEMAHAN.
 */
export const PROMPT_VERSION = "generate-status.v8";

import { labelPersonaDenganDetail } from "@/lib/ai/persona";
import { batasPlatform, LABEL_PLATFORM, type PlatformId } from "@/lib/platforms/batas";
import { BATAS_JUMLAH, type Ide, type Pengaturan } from "@/lib/ai/schemas";
import { ATURAN_BAHASA } from "@/lib/ai/gaya-bahasa";
import { instruksiKerangka } from "@/lib/ai/kerangka";
import { ATURAN_ANTI_TERJEMAHAN } from "./generate-status.v7";

export interface GenerateStatusInput {
  namaProduk: string;
  ringkasan: string;
  fitur: string[];
  ide: Ide;
  pengaturan: Pengaturan;
  link?: string;
  /** Platform tujuan; default Threads. Dipakai untuk batas karakter dan gaya. */
  platform?: PlatformId;
  /** Kategori penawaran untuk membedakan gaya konten */
  kategori?: string;
}

const HOOK_INSTRUCTIONS: Record<Pengaturan["gaya_hook"], string> = {
  curiosity_gap:
    "Status pertama dibuka dengan formula CURIOSITY GAP: ungkapkan fakta unik atau celah penasaran yang memancing pembaca untuk membaca kelanjutannya tanpa clickbait palsu.",
  before_after:
    "Status pertama dibuka dengan formula BEFORE-AFTER: kontraskan kondisi repot/frustrasi sebelum menemukan solusi dengan kemudahan sesudahnya.",
  contrarian:
    "Status pertama dibuka dengan formula CONTRARIAN: bantah anggapan umum atau mitos keliru yang sering dipercaya seputar topik penawaran ini.",
  masalah_relatif:
    "Status pertama dibuka dengan formula AUDIENCE PAIN: soroti satu kerepotan atau masalah spesifik yang paling sering dirasakan audiens.",
  pertanyaan:
    "Status pertama dibuka dengan pertanyaan reflektif yang langsung mengena pada situasi pembaca.",
  pernyataan_mengejutkan:
    "Status pertama dibuka dengan pernyataan mengejutkan atau angka/fakta riil (tanpa melebih-lebihkan).",
  // Lima gaya baru (file referensi user "Contoh Prompt natural"):
  educative:
    "Status pertama dibuka dengan formula EDUCATIVE: beri satu hal kecil yang sering kelewat atau yang perlu dicek sebelum beli (mis. \"hal kecil yang sering kelewat\", \"yang perlu dicek sebelum beli\"). Fokus ke fungsi dan keamanan memilih, bukan rayuan.",
  fomo_lembut:
    "Status pertama dibuka dengan formula FOMO LEMBUT: beri konteks waktu yang faktual (mis. \"akhir-akhir ini sering dipakai\", \"pantes banyak yang repeat\") tanpa nakut-nakutin dan tanpa panik. Informasi, bukan tekanan.",
  negative_stop:
    "Status pertama dibuka dengan formula NEGATIVE/STOP: rem impuls pembaca dengan peringatan ringan (mis. \"jangan asal pilih\", \"stop keburu checkout\", \"ini yang sering bikin nyesel\"). Cocok untuk konten warning dan perbandingan; tetap sopan, bukan menakut-nakuti.",
  urgensi_rasional:
    "Status pertama dibuka dengan formula URGENSI RASIONAL: tanpa countdown dan tanpa tekanan, hanya logika waktu yang masuk akal (mis. \"kalau butuh, jangan ditunda\", \"biar gak beli dua kali\", \"sekali beli, kepake lama\").",
  pengalaman_nyata:
    "Status pertama dibuka dengan formula REAL EXPERIENCE: cerita kecil dari pengalaman pemakaian (mis. \"ini yang gue rasain setelah pakai\", \"bukan instan, tapi kepake\"). Paling aman buat bangun trust — cerita kecil lebih kuat dari klaim besar.",
  bawaan: "Status pertama dibuka dengan hook kuat yang cocok untuk platform ini.",
};

const LINK_INSTRUCTIONS: Record<Pengaturan["letak_link"], string> = {
  status_terakhir: "Letak link: sisipkan link penawaran di status TERAKHIR saja: ",
  balasan: "Letak link: JANGAN taruh link di utas utama. Tulis satu baris placeholder [LINK] yang akan dipindahkan ke balasan terpisah setelah generate.",
  tanpa_link: "Letak link: jangan sisipkan link apa pun.",
};

const GAYA_PLATFORM: Record<PlatformId, string> = {
  threads: "Gaya Threads: santai, percakapan, boleh panjang dan bernuansa cerita.",
  x: "Gaya X: ringkas dan tajam; satu ide per status; hindari basa-basi karena ruang sangat terbatas.",
  whatsapp_status:
    "Gaya WhatsApp Status: santai pribadi seperti update status; kalimat pendek yang enak dibaca di layar ponsel; tanpa hashtag.",
  tiktok_caption:
    "Gaya Caption TikTok: hook kuat di kalimat pertama, bahasa lisan sehari-hari, emoji secukupnya, dan ajakan yang jelas di akhir.",
};

export function instruksiKategori(kategori?: string): string {
  const k = (kategori ?? "").toLowerCase().trim();
  if (k.includes("hosting") || k.includes("saas")) {
    return "- Kategori Penawaran (Hosting / SaaS): Gunakan sudut pandang EDUKASI dan PERBANDINGAN spesifikasi atau kebutuhan siapa (value for money). HINDARI hard-selling seperti promo harga murah meriah khas marketplace fisik.";
  }
  if (k.includes("kursus")) {
    return "- Kategori Penawaran (Kursus): Gunakan sudut pandang PENINGKATAN SKILL, kurikulum praktis, pemecahan masalah, dan hasil belajar nyata.";
  }
  if (k.includes("marketplace") || k.includes("shopee") || k.includes("tokopedia")) {
    return "- Kategori Penawaran (Marketplace): Gunakan sudut pandang REVIEW PRODUK, kepraktisan pemakaian harian, dan promo harga/manfaat belanja.";
  }
  return "- Kategori Penawaran: Gunakan sudut pandang pemecahan masalah dan manfaat nyata bagi pengguna.";
}

export function buildGenerateStatusPrompt(input: GenerateStatusInput): string {
  const platform: PlatformId = input.platform ?? "threads";
  const batas = batasPlatform(platform);
  const { pengaturan, ide, link, kategori } = input;
  const rentang = BATAS_JUMLAH[pengaturan.jumlah_status];

  const panjangLine =
    pengaturan.panjang_status === "singkat"
      ? "Panjang per status: singkat (1-3 kalimat)."
      : pengaturan.panjang_status === "sedang"
        ? "Panjang per status: sedang (3-6 kalimat)."
        : `Panjang per status: panjang (6-10 kalimat), tetapi tetap di bawah ${batas} karakter.`;

  const linkLine =
    pengaturan.letak_link === "status_terakhir" && link
      ? LINK_INSTRUCTIONS.status_terakhir + link
      : LINK_INSTRUCTIONS[pengaturan.letak_link];

  const personaLine = `- Persona: ${labelPersonaDenganDetail(
    pengaturan.persona,
    pengaturan.persona_nama,
    pengaturan.persona_gaya,
  )}`;

  const trustLine = pengaturan.aturan_kepercayaan
    ? "- Wajib ada minimal satu status yang menyebut kekurangan atau batasan penawaran secara jujur."
    : "- Aturan kepercayaan nonaktif: tidak wajib menyebut kekurangan, tetapi tetap jangan mengarang kelebihan.";

  const slopLine = pengaturan.anti_ai_slop
    ? `- Anti AI Slop aktif: panjang antarstatus TIDAK boleh seragam (campur pendek dan panjang), bentuk tiap status harus berbeda (ada yang paragraf, ada yang daftar singkat, ada yang satu kalimat), dan dilarang membuka dengan frasa generik seperti "Dalam dunia yang serba cepat".`
    : "- Gaya bebas, panjang boleh lebih seragam.";

  const instruksiLine = pengaturan.instruksi.trim()
    ? `- Instruksi tambahan dari user: ${pengaturan.instruksi.trim()}`
    : "";

  const kategoriLine = instruksiKategori(kategori);

  const dasar = `Kamu adalah kreator konten affiliate berbahasa Indonesia kasual untuk platform ${LABEL_PLATFORM[platform]}.

PENAWARAN: ${input.namaProduk}
Kategori: ${kategori || "Umum"}
Ringkasan: ${input.ringkasan}
Fitur/Spesifikasi: ${input.fitur.join("; ") || "-"}

KONTEN yang harus ditulis:
- Judul: ${ide.judul}
- Deskripsi ide: ${ide.deskripsi}
- Jembatan ke penawaran: ${ide.jembatan}
- Label format: ${ide.format_label}

PENGATURAN:
- Platform tujuan: ${platform}. ${GAYA_PLATFORM[platform]}
- Jumlah status: ${rentang.min}-${rentang.max} status (pilih di rentang ini).
${panjangLine}
${personaLine}
${kategoriLine}
- ${HOOK_INSTRUCTIONS[pengaturan.gaya_hook]}
- ${linkLine}
${trustLine}
${slopLine}
${instruksiLine}

Aturan keras:
- Setiap status MAKSIMAL ${batas} karakter. Hitung sebelum menjawab.
- Ikuti persona dan arah nadanya, tetapi jangan mengubah, menambah, atau mengarang fakta penawaran demi gaya.
- Bahasa Indonesia kasual, tanpa hashtag berlebihan.
- Jangan mengarang spesifikasi, harga, klaim "terbaik", atau diskon yang tidak ada di data.
- Tulis tepat dalam rentang jumlah status yang diminta.
- Balas HANYA dalam JSON valid, tanpa teks lain dan tanpa markdown.

Format JSON:
{
  "statuses": ["status 1", "status 2"]
}`;

  // Susunan blok sama dengan v7: bahasa -> kerangka -> anti-terjemahan.
  const denganBahasa = `${dasar}\n\n${ATURAN_BAHASA}`;
  const kerangka = instruksiKerangka(pengaturan.kerangka);
  const denganKerangka = kerangka ? `${denganBahasa}\n\n${kerangka}` : denganBahasa;
  return `${denganKerangka}\n\n${ATURAN_ANTI_TERJEMAHAN}`;
}
