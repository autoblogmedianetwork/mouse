/**
 * Prompt 8 — carousel slides (Fase 3 & 4.5, docs/fitur-carousel.md).
 *
 * Menghasilkan susunan slide terstruktur (cover, isi, cta) dan caption lengkap.
 * Render gambar dilakukan secara visual di frontend (client-side canvas / HTML snapshot).
 */
export const PROMPT_VERSION = "carousel-slides.v1";

import { labelPersonaUntukPrompt } from "@/lib/ai/persona";
import type { Ide, Pengaturan } from "@/lib/ai/schemas";

export interface CarouselPromptInput {
  namaProduk: string;
  ringkasan: string;
  fitur?: string[];
  ide: Ide;
  pengaturan: Pengaturan;
  link?: string;
  sumber?: string;
  handle?: string;
  jumlahSlide?: number;
}

export function buildCarouselPrompt(input: CarouselPromptInput): string {
  const { pengaturan, ide } = input;
  const jumlahSlide =
    input.jumlahSlide && input.jumlahSlide >= 3 && input.jumlahSlide <= 10
      ? input.jumlahSlide
      : 5;
  const adaLink =
    input.link?.trim() || pengaturan.letak_link !== "tanpa_link" ? "ya" : "tidak";
  const sumber = input.sumber?.trim() || "";
  const handle = input.handle?.trim() || "";

  const instruksiLine = pengaturan.instruksi.trim()
    ? `- Instruksi tambahan dari user: ${pengaturan.instruksi.trim()}`
    : "";

  const trustLine = pengaturan.aturan_kepercayaan
    ? "- Sertakan satu poin batasan atau tips objektif produk yang jujur."
    : "- Hindari klaim palsu atau berlebihan.";

  const hookGuidance =
    pengaturan.gaya_hook === "curiosity_gap"
      ? "- Gaya hook cover: formula CURIOSITY GAP (fakta unik atau celah penasaran alami)."
      : pengaturan.gaya_hook === "before_after"
        ? "- Gaya hook cover: formula BEFORE-AFTER (kontras masalah sebelum vs kemudahan sesudah)."
        : pengaturan.gaya_hook === "contrarian"
          ? "- Gaya hook cover: formula CONTRARIAN (membantah mitos umum seputar kategori produk)."
          : pengaturan.gaya_hook === "masalah_relatif"
            ? "- Gaya hook cover: formula AUDIENCE PAIN (soroti keluhan atau kerepotan nyata pembaca)."
            : "";

  return `Kamu adalah penulis carousel konten affiliate berbahasa Indonesia kasual untuk Instagram dan Threads.

Ide terpilih:
<ide>
Judul: ${ide.judul}
Deskripsi: ${ide.deskripsi}
Jembatan ke produk: ${ide.jembatan}
Format: ${ide.format_label}
</ide>

Ringkasan produk:
<produk>
Nama: ${input.namaProduk}
Ringkasan: ${input.ringkasan}
Fitur: ${input.fitur?.join("; ") || "-"}
</produk>

Pengaturan:
- Jumlah slide: ${jumlahSlide} (antara 3 sampai 10)
- Persona: ${labelPersonaUntukPrompt(pengaturan.persona)}
- Ada link affiliate: ${adaLink}
- Sumber artikel: ${sumber || "(tidak ada)"}
- Handle akun: ${handle || "(tidak ada)"}
${hookGuidance ? hookGuidance + "\n" : ""}${trustLine}
${instruksiLine}

Bagian 1: slide
Susun tepat ${jumlahSlide} slide dengan urutan:
1. Slide 1 (cover): peran "cover", kicker (label kecil maksimal 3 kata), dan headline (maksimal 8 kata).
2. Slide 2 sampai ${jumlahSlide - 1} (isi): peran "isi", judul (maksimal 6 kata), dan isi penjelasan (maksimal 25 kata). Satu ide/poin jelas per slide.
3. Slide terakhir (CTA): peran "cta", judul (maksimal 6 kata, misal "Simpan & Cek Link"), isi ajakan halus (maksimal 12 kata). Jika ada link affiliate, arahkan ke bio atau komentar. Jangan memaksa.

Aturan keras:
- Hanya gunakan informasi dari ide dan ringkasan produk. Jangan mengarang fitur, harga, diskon, atau klaim seperti "terbaik" / "100% aman".
- Setiap slide harus berdiri sendiri dan nyaman dibaca cepat di layar ponsel.
- Hindari kata klise: "Yuk simak", "Wajib punya", "Game changer", "Jangan lewatkan".

Bagian 2: caption
- Caption maksimal 2.200 karakter.
- Dimulai dengan hook yang mengulang inti slide pertama, ringkasan manfaat, lalu ajakan.
- Sertakan disclosure affiliate (misalnya "#affiliate" atau "Mengandung tautan affiliate") jika Ada link affiliate = ya.
- Hashtag maksimal 5 yang relevan.

Balas HANYA dengan JSON valid, tanpa teks pengantar dan tanpa blok markdown.

Format JSON:
{
  "slides": [
    {
      "urutan": 1,
      "peran": "cover",
      "kicker": "string",
      "headline": "string",
      "judul": null,
      "isi": null
    },
    {
      "urutan": 2,
      "peran": "isi",
      "kicker": null,
      "headline": null,
      "judul": "string",
      "isi": "string"
    },
    {
      "urutan": ${jumlahSlide},
      "peran": "cta",
      "kicker": null,
      "headline": null,
      "judul": "string",
      "isi": "string"
    }
  ],
  "caption": "string",
  "hashtag": ["string"],
  "klaim_perlu_cek": ["string"]
}`;
}
