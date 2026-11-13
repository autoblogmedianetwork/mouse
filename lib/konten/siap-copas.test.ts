import { describe, expect, it } from "vitest";
import {
  jamJadwal,
  kunciTanggalLokal,
  kontenSiapCopas,
  ringkasanSiapCopas,
  teksSiapCopas,
  type KontenSiapCopas as K,
} from "./siap-copas";

function konten(p: Partial<K> & { id: string }): K {
  return {
    judul: "Produk A",
    statuses: ["Isi konten"],
    status: "siap_posting",
    jadwal_at: null,
    link_produk: "",
    letak_link: "balasan",
    ...p,
  };
}

describe("siap copas", () => {
  it("kunciTanggalLokal memakai tanggal lokal (bukan UTC)", () => {
    expect(kunciTanggalLokal(new Date(2026, 10, 12, 1, 30))).toBe("2026-11-12");
  });

  it("konten terjadwal hari ini diambil & diurut jam; terkirim dilewati", () => {
    const data = [
      konten({ id: "a", jadwal_at: "2026-11-12T19:00:00.000Z" }),
      konten({ id: "b", jadwal_at: "2026-11-12T08:00:00.000Z" }),
      konten({ id: "c", jadwal_at: "2026-11-12T12:00:00.000Z", status: "terkirim" }),
      konten({ id: "d", jadwal_at: "2026-11-13T08:00:00.000Z" }),
    ];
    const { terjadwal } = kontenSiapCopas(data, "2026-11-12");
    expect(terjadwal.map((k) => k.id)).toEqual(["b", "a"]);
  });

  it("cadangan = siap_posting tanpa jadwal, maksimal 10", () => {
    const data = Array.from({ length: 12 }, (_, i) => konten({ id: `c${i}` }));
    const { cadangan } = kontenSiapCopas(data, "2026-11-12");
    expect(cadangan).toHaveLength(10);
  });

  it("teksSiapCopas: status digabung, tanpa link -> balasan null", () => {
    const r = teksSiapCopas(konten({ id: "x", statuses: ["  halo dunia  ", "kedua"] }));
    expect(r.utama).toBe("halo dunia\n\nkedua");
    expect(r.balasan).toBeNull();
  });

  it("teksSiapCopas: link di balasan + keterangan afiliasi, tidak ikut teks utama", () => {
    const r = teksSiapCopas(
      konten({ id: "x", statuses: ["halo"], link_produk: "https://shope.ee/abc" }),
    );
    expect(r.balasan).toContain("https://shope.ee/abc");
    expect(r.balasan).toContain("komisi");
    expect(r.utama).not.toContain("shope.ee");
  });

  it("letak_link status_terakhir / tanpa_link -> tanpa blok balasan", () => {
    const a = teksSiapCopas(
      konten({ id: "a", statuses: ["halo"], link_produk: "https://shope.ee/abc", letak_link: "status_terakhir" }),
    );
    expect(a.balasan).toBeNull();
    const b = teksSiapCopas(
      konten({ id: "b", statuses: ["halo"], link_produk: "https://shope.ee/abc", letak_link: "tanpa_link" }),
    );
    expect(b.balasan).toBeNull();
  });

  it("jamJadwal membaca jam dari ISO", () => {
    expect(jamJadwal("2026-11-12T19:30:00.000Z")).toBe("19:30");
    expect(jamJadwal(null)).toBe("");
  });

  it("ringkasan menyebut cadangan bila ada", () => {
    const s = ringkasanSiapCopas([konten({ id: "a" })], [konten({ id: "b" })]);
    expect(s).toContain("1 konten terjadwal");
    expect(s).toContain("1 cadangan");
    expect(ringkasanSiapCopas([], [])).toContain("Belum ada konten");
  });
});
