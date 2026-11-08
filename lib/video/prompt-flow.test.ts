/**
 * Penyusun prompt: Storyboard ChatGPT (prompt 04) dan prompt Google Flow per
 * scene (template 07). Tidak ada panggilan AI di sini, hanya teks.
 */
import { describe, expect, it } from "vitest";
import { PROMPT_STORYBOARD_VERSI, susunPromptStoryboard } from "./prompt-storyboard";
import {
  KUNCI_PRODUK,
  PROMPT_FLOW_VERSI,
  batasKataNarasi,
  susunPromptFlowScene,
  susunSemuaPromptFlow,
} from "./prompt-flow";
import { validasiStoryboard } from "./storyboard";

const dataStoryboard = {
  namaProduk: "Rice Cooker 1,8 L",
  varian: "Putih",
  ringkasan: "Menjaga nasi hangat sampai 12 jam.",
  adaFoto: true,
  angleJudul: "Nasi hangat sepanjang hari",
  angleFormat: "Problem-Solution",
  hook: "Nasi cepat dingin?",
  durasiDetik: 10,
  jumlahScene: 3,
  instruksiTambahan: "Tanpa wajah orang",
};

describe("susunPromptStoryboard", () => {
  it("memakai penanda versi prompt 04 v1", () => {
    expect(PROMPT_STORYBOARD_VERSI).toBe("storyboard.v1");
  });

  it("mengisi semua nilai yang diberikan", () => {
    const prompt = susunPromptStoryboard(dataStoryboard);
    expect(prompt).toContain("Nama: Rice Cooker 1,8 L");
    expect(prompt).toContain("Varian: Putih");
    expect(prompt).toContain("Judul: Nasi hangat sepanjang hari");
    expect(prompt).toContain("Hook: Nasi cepat dingin?");
    expect(prompt).toContain("Durasi total: 10 detik");
    expect(prompt).toContain("Jumlah scene: 3");
    expect(prompt).toContain("Instruksi tambahan: Tanpa wajah orang");
    expect(prompt).toContain("Foto referensi tersedia: ya");
  });

  it("menandai kolom kosong, bukan mengosongkannya", () => {
    const prompt = susunPromptStoryboard({
      namaProduk: "Tas Kanvas",
      ringkasan: "Tas tebal.",
      adaFoto: false,
    });
    expect(prompt).toContain("Varian: (tidak diisi)");
    expect(prompt).toContain("Foto referensi tersedia: tidak");
  });

  it("tetap memuat larangan inti prompt 04", () => {
    const prompt = susunPromptStoryboard(dataStoryboard);
    expect(prompt).toContain("Balas HANYA dengan JSON valid");
    expect(prompt).toContain("Jangan menyebut harga");
    expect(prompt).toContain("Teks layar maksimal 8 kata");
    expect(prompt).toContain('"scenes"');
  });
});

const storyboard = (() => {
  const hasil = validasiStoryboard(
    JSON.stringify({
      durasi_total_detik: 10,
      scenes: [
        { urutan: 1, durasi_detik: 3, visual: "Nasi dingin di mangkuk", gerakan_kamera: "push in", teks_layar: "Nasi cepat dingin?", narasi: "Nasi cepat dingin." },
        { urutan: 2, durasi_detik: 4, visual: "Panel warm menyala", gerakan_kamera: "close up", teks_layar: "Warm 12 jam", narasi: null },
        { urutan: 3, durasi_detik: 3, visual: "Nasi di piring beruap", gerakan_kamera: "statis", teks_layar: "Hangat sampai makan", narasi: null },
      ],
    }),
  );
  if (!hasil.ok) throw new Error(hasil.error);
  return hasil.storyboard;
})();

describe("susunPromptFlowScene", () => {
  it("memakai penanda versi template 07 v1", () => {
    expect(PROMPT_FLOW_VERSI).toBe("foto-ke-video.v1");
  });

  it("selalu memuat kunci produk dan larangan", () => {
    for (const scene of storyboard.scenes) {
      const prompt = susunPromptFlowScene(scene, { namaProduk: "Rice Cooker 1,8 L" });
      expect(prompt).toContain(KUNCI_PRODUK);
      expect(prompt).toContain("Jangan menampilkan harga");
      expect(prompt).toContain("Jangan menambahkan logo");
    }
  });

  it("memuat visual, kamera, durasi, dan teks layar scene", () => {
    const prompt = susunPromptFlowScene(storyboard.scenes[1], {
      namaProduk: "Rice Cooker 1,8 L",
      varian: "Putih",
    });
    expect(prompt).toContain("berdurasi 4 detik");
    expect(prompt).toContain("Adegan (scene 2): Panel warm menyala");
    expect(prompt).toContain("Gerakan kamera: close up");
    expect(prompt).toContain('Teks di layar (tulis apa adanya, tanpa menambah teks lain): "Warm 12 jam"');
    expect(prompt).toContain("Rice Cooker 1,8 L — Putih");
  });

  it("hanya menyebut hook pada scene 1", () => {
    expect(susunPromptFlowScene(storyboard.scenes[0], { namaProduk: "X" })).toContain(
      "Hook dalam 3 detik pertama.",
    );
    expect(susunPromptFlowScene(storyboard.scenes[2], { namaProduk: "X" })).not.toContain(
      "Hook dalam 3 detik pertama.",
    );
  });

  it("menulis batas kata narasi sesuai durasi scene", () => {
    expect(susunPromptFlowScene(storyboard.scenes[0], { namaProduk: "X" })).toContain(
      "maksimal 6 kata",
    );
    expect(susunPromptFlowScene(storyboard.scenes[1], { namaProduk: "X" })).toContain(
      "Tanpa narasi voice-over.",
    );
  });

  it("tidak meninggalkan placeholder atau kurung kurawal kosong", () => {
    const prompt = susunPromptFlowScene(storyboard.scenes[2], { namaProduk: "X" });
    expect(prompt).not.toMatch(/\{\{|\}\}/);
  });
});

describe("susunSemuaPromptFlow", () => {
  it("membuat satu blok per scene plus pengingat", () => {
    const teks = susunSemuaPromptFlow(storyboard, { namaProduk: "Rice Cooker 1,8 L" });
    expect(teks).toContain("=== SCENE 1 (3 dtk) ===");
    expect(teks).toContain("=== SCENE 2 (4 dtk) ===");
    expect(teks).toContain("=== SCENE 3 (3 dtk) ===");
    expect(teks).toContain("=== PENGINGAT ===");
    expect(teks).toContain("bandingkan bentuk, warna, dan isi paket dengan foto asli");
    expect(teks.match(/Produk harus tetap persis seperti di foto/g)).toHaveLength(3);
  });

  it("meneruskan instruksi tambahan ke setiap scene", () => {
    const teks = susunSemuaPromptFlow(storyboard, {
      namaProduk: "X",
      instruksiTambahan: "Tanpa wajah orang",
    });
    expect(teks.match(/Instruksi tambahan dari user: Tanpa wajah orang/g)).toHaveLength(3);
  });
});

describe("batasKataNarasi", () => {
  it("memakai dua kata per detik dengan minimum satu", () => {
    expect(batasKataNarasi(4)).toBe(8);
    expect(batasKataNarasi(0.5)).toBe(1);
  });
});
