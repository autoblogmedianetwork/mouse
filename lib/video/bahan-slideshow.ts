import { z } from "zod";

/**
 * Bahan video slideshow (ADR 0021) — jembatan Heaviliate -> Colab.
 *
 * Aplikasi TIDAK merender video (ADR 0018 tetap berlaku). Yang dihasilkan
 * hanya satu blok JSON berisi naskah per scene, URL foto produk, pilihan
 * suara, dan pengaturan keluaran. Render terjadi di notebook Colab
 * `docs/colab/heaviliate-slideshow.ipynb`: foto dijadikan slideshow 9:16
 * dengan suara TTS Bahasa Indonesia (edge-tts) — tanpa GPU, tanpa API key.
 *
 * Batasan mewarisi ADR 0019: tanpa wajah/tubuh orang; produk tidak boleh
 * berubah bentuk karena yang dipakai foto produk asli milik user.
 */

export const SUARA_SLIDESHOW = ["id-ID-ArdiNeural", "id-ID-GadisNeural"] as const;
export type SuaraSlideshow = (typeof SUARA_SLIDESHOW)[number];

/** Label ramah untuk UI; nilai yang dikirim tetap id suara edge-tts. */
export const LABEL_SUARA: Record<SuaraSlideshow, string> = {
  "id-ID-ArdiNeural": "Ardi (suara pria)",
  "id-ID-GadisNeural": "Gadis (suara wanita)",
};

const skemaScene = z.object({
  /** Naskah yang dibacakan suara sekaligus jadi caption di layar. */
  teks: z.string().trim().min(1, "Teks scene kosong").max(220, "Teks scene melebihi 220 karakter"),
  foto_url: z
    .string()
    .trim()
    .regex(/^https?:\/\/\S+$/, "URL foto harus diawali http:// atau https://"),
  /** Durasi minimum per scene; durasi final mengikuti panjang audio suara. */
  durasi_detik: z.number().int().min(2).max(8).default(4),
});

export const bahanSlideshowSkema = z.object({
  versi: z.literal(1),
  produk: z.object({
    nama: z.string().trim().min(1, "Nama produk kosong").max(120),
    harga_tampil: z.string().trim().max(40).default(""),
    url_affiliate: z.string().trim().max(500).default(""),
  }),
  suara: z.enum(SUARA_SLIDESHOW),
  scene: z.array(skemaScene).min(1, "Minimal satu scene").max(6, "Maksimal 6 scene"),
  keluaran: z.object({
    lebar: z.literal(1080),
    tinggi: z.literal(1920),
    fps: z.literal(30),
    nama_berkas: z.string().trim().min(1).max(80),
  }),
});

export type BahanSlideshow = z.infer<typeof bahanSlideshowSkema>;

export type MasukanSlideshow = {
  namaProduk: string;
  hargaTampil: string;
  urlAffiliate: string;
  suara: SuaraSlideshow;
  /** Satu baris = satu scene. */
  naskah: string;
  /** Satu baris = satu URL foto. Boleh lebih sedikit dari scene; foto dipakai bergantian. */
  fotoUrls: string;
};

/** Hasil penyusunan: JSON siap tempel ke Colab, atau pesan galat untuk UI. */
export type HasilSusun =
  | { ok: true; json: string; jumlahScene: number; jumlahFoto: number; namaBerkas: string }
  | { ok: false; galat: string };

function pecahBaris(teks: string): string[] {
  return teks
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
}

function slugify(teks: string): string {
  return (
    teks
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "produk"
  );
}

function namaBerkas(namaProduk: string): string {
  const kini = new Date();
  const tanggal = `${kini.getFullYear()}${String(kini.getMonth() + 1).padStart(2, "0")}${String(
    kini.getDate(),
  ).padStart(2, "0")}`;
  return `slideshow-${slugify(namaProduk)}-${tanggal}.mp4`;
}

/**
 * Susun blok JSON bahan slideshow dari masukan form. Galat dirakit manual
 * berbahasa Indonesia supaya bisa langsung ditampilkan di UI.
 */
export function susunBahanSlideshow(masukan: MasukanSlideshow): HasilSusun {
  const nama = masukan.namaProduk.trim();
  if (!nama) return { ok: false, galat: "Isi nama produk dulu di bagian Data produk." };

  const barisNaskah = pecahBaris(masukan.naskah);
  if (barisNaskah.length === 0) {
    return { ok: false, galat: "Naskah masih kosong. Tulis satu baris per scene (1-6 scene)." };
  }
  if (barisNaskah.length > 6) {
    return { ok: false, galat: `Naskah ${barisNaskah.length} baris. Maksimal 6 scene — pangkas atau gabungkan.` };
  }

  const barisFoto = pecahBaris(masukan.fotoUrls);
  if (barisFoto.length === 0) {
    return { ok: false, galat: "URL foto masih kosong. Tempel minimal satu link foto produk." };
  }
  const fotoTidakValid = barisFoto.find((u) => !/^https?:\/\/\S+$/.test(u));
  if (fotoTidakValid) {
    return { ok: false, galat: `URL foto tidak valid: ${fotoTidakValid.slice(0, 60)}` };
  }

  // Foto dipakai bergantian bila jumlahnya lebih sedikit dari scene.
  const scene = barisNaskah.map((teks, i) => ({
    teks,
    foto_url: barisFoto[i % barisFoto.length],
    durasi_detik: 4,
  }));

  const bahan = {
    versi: 1 as const,
    produk: {
      nama,
      harga_tampil: masukan.hargaTampil.trim().slice(0, 40),
      url_affiliate: masukan.urlAffiliate.trim().slice(0, 500),
    },
    suara: masukan.suara,
    scene,
    keluaran: {
      lebar: 1080 as const,
      tinggi: 1920 as const,
      fps: 30 as const,
      nama_berkas: namaBerkas(nama),
    },
  };

  const terurai = bahanSlideshowSkema.safeParse(bahan);
  if (!terurai.success) {
    const pertama = terurai.error.issues[0];
    return { ok: false, galat: `Data tidak valid: ${pertama.message}` };
  }

  return {
    ok: true,
    json: JSON.stringify(terurai.data, null, 2),
    jumlahScene: scene.length,
    jumlahFoto: barisFoto.length,
    namaBerkas: bahan.keluaran.nama_berkas,
  };
}
