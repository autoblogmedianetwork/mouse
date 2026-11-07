/**
 * Golden set runner (Fase 3). `npm run test:golden` starts this file through
 * `vitest.golden.config.ts`, so the prompt builders, Zod schemas and
 * `generateJSON` path are exactly the ones the app uses.
 *
 * Stage 1 (automatic, from golden/README.md): JSON valid, exactly 10 ideas,
 * labels from FORMAT_LABELS, no status over 500 characters, no price when the
 * golden file forbids it.
 * Stage 2 (manual, from golden/rubrik.md): five criteria scored 1-5 by the
 * owner, stored in `penilaian` inside golden/produk-*.json.
 *
 * Exit criteria Fase 3: at least 8 of 10 products pass every manual criterion
 * with a score >= 3. Evidence is written to golden/hasil/<stamp>/.
 *
 * `--dry-run` (GOLDEN_DRY_RUN=1) checks the files and the harness without
 * calling the AI, so the wiring can be verified before P5 fills the set.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { generateJSON } from "@/lib/ai/generate-json";
import {
  BATAS_JUMLAH,
  FORMAT_LABELS,
  PENGATURAN_AWAL,
  analisisSkema,
  ideSkema,
  statusesSkema,
  type Analisis,
  type IdeBatch,
  type Pengaturan,
} from "@/lib/ai/schemas";
import {
  buildAnalisisPenawaranPrompt,
  PROMPT_VERSION as VERSI_ANALISIS,
} from "@/lib/ai/prompts/analisis-penawaran.v3";
import {
  buildIdeKontenPrompt,
  PROMPT_VERSION as VERSI_IDE,
} from "@/lib/ai/prompts/ide-konten.v2";
import {
  buildGenerateStatusPrompt,
  PROMPT_VERSION as VERSI_STATUS,
} from "@/lib/ai/prompts/generate-status.v6";
import { MAX_STATUS_LENGTH, charLength } from "@/lib/statuses/validator-500";

const AKAR = process.cwd();
const DIR_GOLDEN = path.join(AKAR, "golden");
const DRY_RUN = process.env.GOLDEN_DRY_RUN === "1";

/** Status text must not mention a price (PRD F3, golden/README.md). */
const POLA_HARGA = /\bRp\.?\s?\d|\bIDR\b/i;
/** Status text should concede a shortcoming (advisory, not a gate). */
const POLA_KEKURANGAN = /(tapi|sayangnya|minus|kekurangan|belum|kurang)/i;

const LABEL_SET = new Set<string>(FORMAT_LABELS);

/** Same generate settings for every product, so runs stay comparable. */
const PENGATURAN_UJI: Pengaturan = {
  ...PENGATURAN_AWAL,
  jumlah_status: "menengah",
  letak_link: "tanpa_link",
};

const KRITERIA_MANUAL = [
  "kesesuaian_deskripsi",
  "bahasa_indonesia_kasual",
  "tanpa_klaim_tak_terbukti",
  "variasi_antarstatus",
  "kepatuhan_karakter",
] as const;

interface InputGolden {
  nama: string | null;
  varian: string | null;
  harga: string | null;
  deskripsi_bersih: string | null;
  foto: string[];
}

interface HarapanGolden {
  analisis: { wajib_ada_fitur: string[]; tidak_boleh_ada: string[] };
  ide: { jumlah: number; wajib_ada_format: string[] };
  status: {
    maks_karakter: number;
    wajib_kekurangan: boolean;
    tidak_boleh_ada_harga: boolean;
  };
}

interface ProdukGolden {
  id: string;
  status: string;
  keterangan?: string;
  kategori: string | null;
  input: InputGolden;
  harapan: HarapanGolden;
  penilaian: Record<string, number | string | null>;
}

interface Cek {
  nama: string;
  lulus: boolean;
  /** A failing mandatory check blocks the run; advisory checks only annotate. */
  wajib: boolean;
  detail?: string;
}

interface HasilProduk {
  produk: ProdukGolden;
  jsonValid: boolean;
  cek: Cek[];
  peringatan: string[];
  panjangMaks?: number;
  galat?: string;
}

function bacaProduk(): ProdukGolden[] {
  return readdirSync(DIR_GOLDEN)
    .filter((berkas) => /^produk-\d+\.json$/.test(berkas))
    .sort()
    .map(
      (berkas) =>
        JSON.parse(readFileSync(path.join(DIR_GOLDEN, berkas), "utf8")) as ProdukGolden,
    );
}

const SEMUA_PRODUK = bacaProduk();
const PRODUK_SIAP = SEMUA_PRODUK.filter(
  (p) => p.status === "siap" && Boolean(p.input?.nama) && Boolean(p.input?.deskripsi_bersih),
);

/** Products still placeholders cannot be assessed; that is a P5 prerequisite. */
function produkSiap(produk: ProdukGolden): boolean {
  return (
    produk.status === "siap" &&
    Boolean(produk.input?.nama) &&
    Boolean(produk.input?.deskripsi_bersih)
  );
}

function skorKarakter(panjangMaks: number): 1 | 3 | 5 {
  if (panjangMaks > MAX_STATUS_LENGTH) return 1;
  if (panjangMaks <= MAX_STATUS_LENGTH * 0.8) return 5;
  return 3;
}

async function jalankanProduk(produk: ProdukGolden): Promise<HasilProduk> {
  const cek: Cek[] = [];
  const peringatan: string[] = [];
  const nama = produk.input.nama ?? "";
  const deskripsi = produk.input.deskripsi_bersih ?? "";

  // Prompt 1 — analysis. Same inputs the /api/analisis route builds.
  const analisis = await generateJSON<Analisis>(
    buildAnalisisPenawaranPrompt({
      deskripsi,
      nama,
      varian: produk.input.varian ?? undefined,
      harga: produk.input.harga ?? undefined,
      kategori: produk.kategori ?? undefined,
    }),
    analisisSkema,
    { retries: 1, timeoutMs: 120_000 },
  );

  if (!analisis.ok || !analisis.data) {
    return {
      produk,
      jsonValid: false,
      cek: [
        {
          nama: "JSON analisis valid",
          lulus: false,
          wajib: true,
          detail: analisis.error,
        },
      ],
      peringatan,
      galat: analisis.error,
    };
  }

  const fitur = analisis.data.fitur;
  const teksAnalisis = [analisis.data.ringkasan, ...fitur].join(" ").toLowerCase();
  const fiturHilang = (produk.harapan.analisis.wajib_ada_fitur ?? []).filter(
    (f) => !teksAnalisis.includes(f.toLowerCase()),
  );
  cek.push({
    nama: "Fitur wajib muncul di analisis",
    lulus: fiturHilang.length === 0,
    wajib: false,
    detail: fiturHilang.length > 0 ? `tidak muncul: ${fiturHilang.join(", ")}` : undefined,
  });

  // Prompt 2 — ten ideas for the analysed product.
  const ide = await generateJSON<IdeBatch>(
    buildIdeKontenPrompt({
      namaProduk: nama,
      ringkasan: analisis.data.ringkasan,
      fitur,
      target_audiens: analisis.data.target_audiens,
      angle: analisis.data.angle,
    }),
    ideSkema,
    { retries: 1, timeoutMs: 120_000 },
  );

  if (!ide.ok || !ide.data) {
    return {
      produk,
      jsonValid: false,
      cek: [
        ...cek,
        { nama: "JSON ide valid", lulus: false, wajib: true, detail: ide.error },
      ],
      peringatan,
      galat: ide.error,
    };
  }

  const diminta = produk.harapan.ide.wajib_ada_format ?? [];
  const tidakDikenal = diminta.filter((f) => !LABEL_SET.has(f));
  if (tidakDikenal.length > 0) {
    peringatan.push(
      `harapan.ide.wajib_ada_format memakai label di luar FORMAT_LABELS (${tidakDikenal.join(", ")}); pemeriksaan dilewati.`,
    );
  }
  const dikenal = diminta.filter((f) => LABEL_SET.has(f));
  const adaFormatDiminta = dikenal.some((f) =>
    ide.data!.ide.some((i) => i.format_label === f),
  );
  cek.push({
    nama: "Format ide yang diminta muncul",
    lulus: dikenal.length === 0 || adaFormatDiminta,
    wajib: false,
    detail:
      dikenal.length > 0 && !adaFormatDiminta
        ? `tidak ada ide berlabel ${dikenal.join(" / ")}`
        : undefined,
  });

  // Prompt 3 — statuses for the first idea, Threads limit (AGENTS rule 10).
  const status = await generateJSON<{ statuses: string[] }>(
    buildGenerateStatusPrompt({
      namaProduk: nama,
      ringkasan: analisis.data.ringkasan,
      fitur,
      ide: ide.data.ide[0],
      pengaturan: PENGATURAN_UJI,
      platform: "threads",
      kategori: produk.kategori ?? undefined,
    }),
    statusesSkema(BATAS_JUMLAH[PENGATURAN_UJI.jumlah_status], MAX_STATUS_LENGTH),
    { retries: 2, timeoutMs: 120_000 },
  );

  if (!status.ok || !status.data) {
    return {
      produk,
      jsonValid: false,
      cek: [
        ...cek,
        { nama: "JSON status valid", lulus: false, wajib: true, detail: status.error },
      ],
      peringatan,
      galat: status.error,
    };
  }

  const statuses = status.data.statuses;
  const panjangMaks = Math.max(...statuses.map((s) => charLength(s)));
  cek.push({
    nama: "Tidak ada status di atas 500 karakter",
    lulus: panjangMaks <= MAX_STATUS_LENGTH,
    wajib: true,
    detail: `terpanjang ${panjangMaks} karakter`,
  });

  if (produk.harapan.status.tidak_boleh_ada_harga) {
    const berharga = statuses.filter((s) => POLA_HARGA.test(s));
    cek.push({
      nama: "Tidak menyebut harga",
      lulus: berharga.length === 0,
      wajib: true,
      detail: berharga.length > 0 ? `${berharga.length} status menyebut harga` : undefined,
    });
  }

  if (produk.harapan.status.wajib_kekurangan) {
    const adaKekurangan = statuses.some((s) => POLA_KEKURANGAN.test(s));
    cek.push({
      nama: "Menyebut satu kekurangan (saran, bukan gate)",
      lulus: adaKekurangan,
      wajib: false,
    });
  }

  return { produk, jsonValid: true, cek, peringatan, panjangMaks };
}

function sel(nilai: number | string | null | undefined): string {
  return typeof nilai === "number" ? String(nilai) : "–";
}

function tulisLaporan(hasil: HasilProduk[], waktu: string): string {
  const model = process.env.AI_MODEL?.trim() || "(default generateJSON)";
  const baris = hasil.map((h) => {
    const p = h.produk;
    const wajib = h.cek.filter((c) => c.wajib);
    const gagalWajib = wajib.filter((c) => !c.lulus);
    const auto = !h.jsonValid
      ? "JSON tidak valid"
      : gagalWajib.length === 0
        ? "lulus"
        : gagalWajib.map((c) => c.nama).join(", ");
    const karakterAuto = h.panjangMaks != null ? String(skorKarakter(h.panjangMaks)) : "1";
    return [
      p.id,
      h.jsonValid ? "ya" : "tidak",
      h.panjangMaks != null ? String(h.panjangMaks) : "–",
      karakterAuto,
      auto,
      sel(p.penilaian?.kesesuaian_deskripsi),
      sel(p.penilaian?.bahasa_indonesia_kasual),
      sel(p.penilaian?.tanpa_klaim_tak_terbukti),
      sel(p.penilaian?.variasi_antarstatus),
      sel(p.penilaian?.kepatuhan_karakter),
      typeof p.penilaian?.catatan === "string" ? p.penilaian.catatan : "",
    ].join(" | ");
  });

  const catatan: string[] = [];
  for (const h of hasil) {
    for (const c of h.cek) {
      if (!c.lulus) catatan.push(`- ${h.produk.id}: ${c.nama} — ${c.detail ?? "tidak lulus"}`);
    }
    for (const p of h.peringatan) catatan.push(`- ${h.produk.id}: ${p} (peringatan input)`);
    if (h.galat) catatan.push(`- ${h.produk.id}: ${h.galat}`);
  }

  return `# Laporan golden set — ${waktu}

Prompt: ${VERSI_ANALISIS}, ${VERSI_IDE}, ${VERSI_STATUS}
Model: ${model}
Pengaturan uji: jumlah ${PENGATURAN_UJI.jumlah_status}, panjang ${PENGATURAN_UJI.panjang_status}, anti AI slop ${PENGATURAN_UJI.anti_ai_slop ? "aktif" : "mati"}, letak link ${PENGATURAN_UJI.letak_link}

## Tahap 1 (otomatis)

| Produk | JSON valid | Maks karakter | Kepatuhan karakter (auto) | Kesimpulan | Kesesuaian | Bahasa | Klaim | Variasi | Kepatuhan |
|---|---|---|---|---|---|---|---|---|---|
${baris.map((b) => `| ${b} |`).join("\n")}

Kolom skor kosong (–) diisi manual memakai \`golden/rubrik.md\`. Skor di bawah 3 wajib diberi alasan di catatan.

## Catatan

${catatan.length > 0 ? catatan.join("\n") : "- Semua pemeriksaan otomatis lulus."}

## Exit criteria Fase 3

Minimal 8 dari 10 produk lolos penilaian manual (semua kriteria bernilai 3 atau lebih).
Isi \`penilaian\` pada \`golden/produk-*.json\`, lalu jalankan \`npm run test:golden\` lagi
untuk menghitung jumlah lolos. Tabel ini disalin ke \`docs/penilaian.md\`.
`;
}

describe("golden set", () => {
  it("10 berkas produk-*.json ada dan strukturnya sesuai", () => {
    expect(SEMUA_PRODUK).toHaveLength(10);
    for (const p of SEMUA_PRODUK) {
      expect(p.id, "id wajib terisi").toMatch(/^produk-\d{2}$/);
      expect(["belum_diisi", "siap"], `${p.id}: status tidak dikenal`).toContain(p.status);
      expect(p.harapan?.ide?.jumlah, `${p.id}: harapan.ide.jumlah harus 10`).toBe(10);
      expect(Array.isArray(p.input?.foto), `${p.id}: input.foto harus array`).toBe(true);
      expect(p.penilaian, `${p.id}: penilaian harus objek`).toBeTypeOf("object");
    }
  });

  if (DRY_RUN) {
    it("dry-run: harness terbaca tanpa memanggil AI", () => {
      console.log(
        `[golden] dry-run OK — ${SEMUA_PRODUK.length} berkas terbaca, ${PRODUK_SIAP.length} siap. Tidak ada panggilan AI, tidak ada penilaian.`,
      );
      expect(SEMUA_PRODUK).toHaveLength(10);
    });
  } else {
    it(
      "tahap 1 dan exit criteria Fase 3",
      async () => {
        const gagal: string[] = [];

        if (PRODUK_SIAP.length !== SEMUA_PRODUK.length) {
          const belum = SEMUA_PRODUK.filter((p) => !produkSiap(p)).map((p) => p.id);
          gagal.push(
            `P5 belum selesai: ${PRODUK_SIAP.length}/${SEMUA_PRODUK.length} produk berstatus "siap" (belum: ${belum.join(", ")}).`,
          );
          console.log(`[golden] ${gagal.join("\n")}`);
          throw new Error(`Golden set belum bisa dinilai:\n- ${gagal.join("\n- ")}`);
        }

        const hasil: HasilProduk[] = [];
        for (const produk of SEMUA_PRODUK) {
          console.log(`[golden] ${produk.id} …`);
          hasil.push(await jalankanProduk(produk));
        }

        const waktu = new Date().toISOString().replace(/[:.]/g, "-");
        const dirHasil = path.join(DIR_GOLDEN, "hasil", waktu);
        mkdirSync(dirHasil, { recursive: true });

        const laporan = tulisLaporan(hasil, waktu);
        writeFileSync(path.join(dirHasil, "laporan.md"), laporan, "utf8");
        writeFileSync(
          path.join(dirHasil, "ringkasan.json"),
          JSON.stringify(
            {
              waktu,
              prompt: { analisis: VERSI_ANALISIS, ide: VERSI_IDE, status: VERSI_STATUS },
              produk: hasil.map((h) => ({
                id: h.produk.id,
                json_valid: h.jsonValid,
                panjang_maks: h.panjangMaks ?? null,
                cek: h.cek,
                peringatan: h.peringatan,
                galat: h.galat ?? null,
              })),
            },
            null,
            2,
          ),
          "utf8",
        );
        console.log(laporan);
        console.log(`[golden] laporan: ${path.relative(AKAR, path.join(dirHasil, "laporan.md"))}`);

        // Stage 1 gates: at least 9 of 10 parse as valid JSON (Fase 2), and
        // every product that parsed passes the mandatory checks.
        const jsonValid = hasil.filter((h) => h.jsonValid).length;
        if (jsonValid < 9) {
          gagal.push(
            `Tahap 1 gagal: hanya ${jsonValid}/10 produk menghasilkan JSON valid (minimal 9).`,
          );
        }
        for (const h of hasil) {
          for (const c of h.cek) {
            if (c.wajib && !c.lulus) {
              gagal.push(`${h.produk.id}: ${c.nama} — ${c.detail ?? "tidak lulus"}.`);
            }
          }
        }

        // Stage 2: manual rubric scores decide the Fase 3 exit criteria.
        const dinilai = hasil.filter((h) =>
          KRITERIA_MANUAL.every((k) => typeof h.produk.penilaian?.[k] === "number"),
        );
        const lolos = dinilai.filter((h) =>
          KRITERIA_MANUAL.every((k) => Number(h.produk.penilaian[k]) >= 3),
        );
        if (dinilai.length < hasil.length) {
          gagal.push(
            `Penilaian manual belum lengkap (${dinilai.length}/10 produk). Isi "penilaian" di golden/produk-*.json memakai golden/rubrik.md.`,
          );
        } else if (lolos.length < 8) {
          gagal.push(
            `Exit criteria Fase 3 belum terpenuhi: ${lolos.length}/10 produk lolos (minimal 8).`,
          );
        }

        if (gagal.length > 0) {
          throw new Error(`Golden set belum lulus:\n- ${gagal.join("\n- ")}`);
        }
        console.log(`[golden] LULUS — ${lolos.length}/10 produk lolos penilaian manual.`);
      },
      900_000,
    );
  }
});
