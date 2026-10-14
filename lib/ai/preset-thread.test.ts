import { describe, expect, it } from "vitest";
import {
  PRESET_THREAD,
  PRESET_THREAD_IDS,
  presetThreadAktif,
  terapkanPresetThread,
} from "./preset-thread";
import { PENGATURAN_AWAL, pengaturanSkema } from "./schemas";

describe("preset panjang thread", () => {
  it("hanya memetakan jumlah dan panjang status yang sudah ada", () => {
    for (const id of PRESET_THREAD_IDS) {
      const hasil = terapkanPresetThread(PENGATURAN_AWAL, id);
      expect(hasil.jumlah_status).toBe(PRESET_THREAD[id].jumlah_status);
      expect(hasil.panjang_status).toBe(PRESET_THREAD[id].panjang_status);
      expect(pengaturanSkema.safeParse(hasil).success).toBe(true);
    }
  });

  it("tidak mengubah pengaturan lain", () => {
    const awal = { ...PENGATURAN_AWAL, persona: "ahli", instruksi: "sebut varian warna" } as const;
    const hasil = terapkanPresetThread(awal, "panjang");
    expect(hasil.persona).toBe("ahli");
    expect(hasil.instruksi).toBe("sebut varian warna");
    expect(hasil.gaya_hook).toBe(awal.gaya_hook);
    expect(hasil.letak_link).toBe(awal.letak_link);
    expect(hasil.anti_ai_slop).toBe(awal.anti_ai_slop);
    expect(hasil.aturan_kepercayaan).toBe(awal.aturan_kepercayaan);
  });

  it("mengenali preset yang sedang aktif", () => {
    for (const id of PRESET_THREAD_IDS) {
      expect(presetThreadAktif(terapkanPresetThread(PENGATURAN_AWAL, id))).toBe(id);
    }
  });

  it("mengembalikan null untuk kombinasi kustom", () => {
    const kustom = { ...PENGATURAN_AWAL, jumlah_status: "panjang", panjang_status: "singkat" } as const;
    expect(presetThreadAktif(kustom)).toBeNull();
  });

  it("preset panjang memakai rentang jumlah status terbesar", () => {
    expect(PRESET_THREAD.panjang.jumlah_status).toBe("panjang");
    expect(PRESET_THREAD.pendek.jumlah_status).toBe("pendek");
  });
});
