/**
 * Ekspor/impor cadangan (Fase 4 exit criteria: "Ekspor dan impor cadangan
 * menghasilkan data yang sama"). Pure functions — no storage access — so the
 * round trip is unit-tested.
 */
import { kontenSkema, type Konten } from "./skema";

export const CADANGAN_VERSI = 1;

export interface Cadangan {
  app: "autothreads";
  versi: number;
  diekspor_pada: string;
  konten: Konten[];
}

export function eksporJSON(list: Konten[], now = new Date()): string {
  const cadangan: Cadangan = {
    app: "autothreads",
    versi: CADANGAN_VERSI,
    diekspor_pada: now.toISOString(),
    konten: [...list].sort((a, b) => a.id.localeCompare(b.id)),
  };
  return JSON.stringify(cadangan, null, 2);
}

/**
 * Parse an exported backup. Throws with an Indonesian message on invalid
 * input; every entry is re-validated with Zod (AGENTS rule 6).
 */
export function imporJSON(raw: string): Konten[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("File bukan JSON valid.");
  }

  const obj = parsed as { app?: unknown; konten?: unknown };
  if (obj?.app !== "autothreads" || !Array.isArray(obj.konten)) {
    throw new Error("Bukan cadangan Heaviliate (field app/konten tidak dikenali).");
  }

  const hasil: Konten[] = [];
  obj.konten.forEach((entry, i) => {
    const result = kontenSkema.safeParse(entry);
    if (!result.success) {
      throw new Error(
        `Entri ke-${i + 1} tidak valid: ${result.error.issues[0]?.message ?? "unknown"}`,
      );
    }
    hasil.push(result.data);
  });
  return hasil;
}

/** Human-readable export for reading/posting outside the app. */
export function eksporTXT(list: Konten[]): string {
  return list
    .map((k) => {
      const header = [
        `=== ${k.judul} ===`,
        `Status: ${k.status}${k.arsip ? " (arsip)" : ""}`,
        k.produk_nama ? `Produk: ${k.produk_nama}` : null,
        k.link_produk ? `Link: ${k.link_produk}` : null,
        `Diubah: ${k.updated_at}`,
      ]
        .filter(Boolean)
        .join("\n");
      const badan = k.statuses.map((s, i) => `[${i + 1}] ${s}`).join("\n\n");
      return `${header}\n\n${badan}\n`;
    })
    .join("\n");
}

/** Escape field for standard CSV RFC 4180. */
function escapeCsv(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Export contents to CSV suitable for Google Sheets or Microsoft Excel.
 */
export function eksporCSV(list: Konten[]): string {
  const headers = [
    "ID",
    "Judul",
    "Status",
    "Kerangka",
    "Produk",
    "Link Produk",
    "Letak Link",
    "Jadwal Tayang",
    "Arsip",
    "Jumlah Status",
    "Hook / Status Pertama",
    "Semua Status (Gabungan)",
    "Terakhir Diubah",
  ];

  const rows = list.map((k) => {
    const hook = k.statuses[0] ?? "";
    const gabunganStatus = k.statuses.map((s, i) => `[${i + 1}] ${s}`).join("\n\n");
    return [
      escapeCsv(k.id),
      escapeCsv(k.judul),
      escapeCsv(k.status),
      escapeCsv(k.kerangka ?? "bebas"),
      escapeCsv(k.produk_nama ?? ""),
      escapeCsv(k.link_produk ?? ""),
      escapeCsv(k.letak_link),
      escapeCsv(k.jadwal_at ?? ""),
      escapeCsv(k.arsip ? "Ya" : "Tidak"),
      escapeCsv(k.statuses.length),
      escapeCsv(hook),
      escapeCsv(gabunganStatus),
      escapeCsv(k.updated_at),
    ].join(",");
  });

  // Include UTF-8 BOM so Excel opens accents and special characters cleanly
  return `\uFEFF${headers.join(",")}\r\n${rows.join("\r\n")}`;
}

/** Merge imported entries into an existing library; newer updated_at wins. */
export function gabungKonten(existing: Konten[], imported: Konten[]): Konten[] {
  const byId = new Map<string, Konten>();
  for (const k of existing) byId.set(k.id, k);
  for (const k of imported) {
    const prev = byId.get(k.id);
    if (!prev || Date.parse(k.updated_at) >= Date.parse(prev.updated_at)) {
      byId.set(k.id, k);
    }
  }
  return [...byId.values()].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
}
