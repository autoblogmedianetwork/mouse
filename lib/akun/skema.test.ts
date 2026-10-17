import { describe, expect, it } from "vitest";
import {
  akunBaruSkema,
  normalisasiUsername,
  tentukanStatusKoneksi,
} from "./skema";

describe("lib/akun/skema", () => {
  describe("normalisasiUsername", () => {
    it("menambahkan '@' jika belum ada", () => {
      expect(normalisasiUsername("affiliate_pro")).toBe("@affiliate_pro");
    });

    it("tidak menduplikasi '@' jika sudah ada", () => {
      expect(normalisasiUsername("@affiliate_pro")).toBe("@affiliate_pro");
      expect(normalisasiUsername("@@@affiliate_pro")).toBe("@affiliate_pro");
    });

    it("membersihkan spasi di awal dan akhir", () => {
      expect(normalisasiUsername("  my_threads  ")).toBe("@my_threads");
    });

    it("mengembalikan string kosong jika input kosong", () => {
      expect(normalisasiUsername("")).toBe("");
      expect(normalisasiUsername("   ")).toBe("");
    });
  });

  describe("tentukanStatusKoneksi", () => {
    const NOW = new Date("2026-10-17T03:00:00.000Z");

    it("mengembalikan 'terhubung' untuk mode manual", () => {
      expect(tentukanStatusKoneksi(null, "manual", NOW)).toBe("terhubung");
    });

    it("mengembalikan 'menunggu_konfigurasi' jika mode otomatis tapi token kosong", () => {
      expect(tentukanStatusKoneksi(null, "otomatis", NOW)).toBe("menunggu_konfigurasi");
      expect(tentukanStatusKoneksi(undefined, "otomatis", NOW)).toBe("menunggu_konfigurasi");
      expect(tentukanStatusKoneksi("invalid-date", "otomatis", NOW)).toBe("menunggu_konfigurasi");
    });

    it("mengembalikan 'kedaluwarsa' jika tanggal token sudah lewat", () => {
      const lampau = new Date("2026-10-10T00:00:00.000Z").toISOString();
      expect(tentukanStatusKoneksi(lampau, "otomatis", NOW)).toBe("kedaluwarsa");
    });

    it("mengembalikan 'akan_kedaluwarsa' jika sisa waktu <= 7 hari", () => {
      const empatHariLagi = new Date("2026-10-21T03:00:00.000Z").toISOString();
      expect(tentukanStatusKoneksi(empatHariLagi, "otomatis", NOW)).toBe("akan_kedaluwarsa");
    });

    it("mengembalikan 'terhubung' jika token masih berlaku > 7 hari", () => {
      const tigapuluhHariLagi = new Date("2026-11-17T03:00:00.000Z").toISOString();
      expect(tentukanStatusKoneksi(tigapuluhHariLagi, "otomatis", NOW)).toBe("terhubung");
    });
  });

  describe("akunBaruSkema", () => {
    it("memvalidasi data akun baru yang benar", () => {
      const input = {
        platform: "Threads" as const,
        username: "tokoku_official",
        nama_tampilan: "Toko Utama",
        mode: "manual" as const,
      };
      const res = akunBaruSkema.safeParse(input);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.username).toBe("tokoku_official");
      }
    });

    it("menolak jika username kosong", () => {
      const input = {
        platform: "Threads" as const,
        username: "   ",
      };
      const res = akunBaruSkema.safeParse(input);
      expect(res.success).toBe(false);
    });
  });
});
