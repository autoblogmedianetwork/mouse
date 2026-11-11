import { describe, expect, it } from "vitest";
import {
  RENCANA_PERDANA,
  hariAktif,
  hariSelesaiSemua,
  mulaiRencana,
  progressPersen,
  rencanaTuntas,
  tandaiTugas,
} from "./rencana-perdana";

describe("rencana perdana 21 hari (data dari file user)", () => {
  it("struktur: 21 hari, 3 fase berurutan, tiap hari punya tugas", () => {
    expect(RENCANA_PERDANA).toHaveLength(21);
    expect(RENCANA_PERDANA.map((h) => h.hari)).toEqual(
      Array.from({ length: 21 }, (_, i) => i + 1),
    );
    const fase = RENCANA_PERDANA.map((h) => h.fase);
    expect(new Set(fase.slice(0, 7))).toEqual(new Set(["tanam"]));
    expect(new Set(fase.slice(7, 14))).toEqual(new Set(["tembak"]));
    expect(new Set(fase.slice(14))).toEqual(new Set(["panen"]));
    for (const h of RENCANA_PERDANA) expect(h.tugas.length).toBeGreaterThan(0);
  });

  it("teks tugas dipakai apa adanya dari file user", () => {
    const h1 = RENCANA_PERDANA[0].tugas[0];
    expect(h1.teks).toContain("Pilih satu niche produk yang kamu pahami");
    const h21 = RENCANA_PERDANA[20].tugas[0];
    expect(h21.teks).toContain("Tinjau 21 hari");
  });

  it("tugas dengan fitur hanya di hari yang memakai aplikasi", () => {
    const denganFitur = RENCANA_PERDANA.flatMap((h) => h.tugas).filter((t) => t.fitur);
    const hari = denganFitur.map((t) => Number(t.id.slice(1, t.id.indexOf("t"))));
    // Hari 1,3,8,11,12,20 punya tombol; hari menulis/balas tidak.
    expect([...hari].sort((a, b) => a - b)).toEqual([1, 3, 8, 11, 12, 20]);
    // Hari menulis cerita tidak punya tombol.
    expect(RENCANA_PERDANA[1].tugas[0].fitur).toBeUndefined();
  });

  it("hari aktif dihitung dari tanggal mulai, dibatasi 1..21", () => {
    expect(hariAktif(mulaiRencana("2026-11-11"), "2026-11-11")).toBe(1);
    expect(hariAktif(mulaiRencana("2026-11-11"), "2026-11-15")).toBe(5);
    expect(hariAktif(mulaiRencana("2026-11-11"), "2026-12-20")).toBe(21);
    expect(hariAktif(mulaiRencana("2026-11-11"), "2026-11-10")).toBe(1); // tanggal mundur
  });

  it("centang tugas: toggle, dan hari selesai hanya kalau semua tugasnya tercentang", () => {
    let status = mulaiRencana("2026-11-11");
    status = tandaiTugas(status, "h1t1");
    expect(hariSelesaiSemua(status, 1)).toBe(true);
    expect(hariSelesaiSemua(status, 2)).toBe(false);
    status = tandaiTugas(status, "h1t1"); // toggle balik
    expect(hariSelesaiSemua(status, 1)).toBe(false);
  });

  it("hari 12 punya dua tugas (cek link + publikasi)", () => {
    const h12 = RENCANA_PERDANA.find((h) => h.hari === 12);
    expect(h12?.tugas).toHaveLength(2);
  });

  it("progress dan tuntas", () => {
    let status = mulaiRencana("2026-11-11");
    expect(progressPersen(status)).toBe(0);
    expect(rencanaTuntas(status)).toBe(false);
    for (const h of RENCANA_PERDANA)
      for (const t of h.tugas) status = tandaiTugas(status, t.id);
    expect(progressPersen(status)).toBe(100);
    expect(rencanaTuntas(status)).toBe(true);
  });
});
