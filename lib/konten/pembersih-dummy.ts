/**
 * One-click cleanup of the sample data shipped by onboarding (AGENTS rule 4:
 * dummy data must be clearly marked and easy to delete). Detection is
 * marker-based ("SAMPEL DUMMY", "Contoh:") so real content is never touched.
 */

export const KEY_KONTEN = "autothreads-konten";
export const KEY_DRAFT = "autothreads-draft-posting";
export const PENANDA_DUMMY = ["sampel dummy", "contoh:"] as const;

type Penyimpanan = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function teksDummy(...nilai: unknown[]): boolean {
  return nilai.some(
    (n) =>
      typeof n === "string" &&
      PENANDA_DUMMY.some((penanda) => n.toLowerCase().includes(penanda)),
  );
}

export function adalahKontenDummy(entry: unknown): boolean {
  if (!entry || typeof entry !== "object") return false;
  const e = entry as { id?: unknown; judul?: unknown; produk_nama?: unknown };
  if (typeof e.id === "string" && e.id.startsWith("contoh-")) return true;
  return teksDummy(e.judul, e.produk_nama);
}

export function adalahDraftDummy(draft: unknown): boolean {
  if (!draft || typeof draft !== "object") return false;
  const produk = (draft as { produk?: { id?: unknown; nama_internal?: unknown; nama?: unknown } })
    .produk;
  if (!produk || typeof produk !== "object") return false;
  if (typeof produk.id === "string" && produk.id.startsWith("contoh-")) return true;
  return teksDummy(produk.nama_internal, produk.nama);
}

export interface HitungDataContoh {
  konten: number;
  draft: boolean;
  total: number;
}

/** Count sample entries without changing anything (drives the button state). */
export function hitungDataContoh(storage: Penyimpanan): HitungDataContoh {
  let konten = 0;
  let draft = false;
  try {
    const raw = storage.getItem(KEY_KONTEN);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) konten = parsed.filter(adalahKontenDummy).length;
    }
  } catch {
    // penyimpanan rusak: tidak ada yang bisa dihitung
  }
  try {
    const rawDraft = storage.getItem(KEY_DRAFT);
    if (rawDraft) draft = adalahDraftDummy(JSON.parse(rawDraft));
  } catch {
    // penyimpanan rusak: anggap tidak ada draft contoh
  }
  return { konten, draft, total: konten + (draft ? 1 : 0) };
}

export interface HasilBersih {
  kontenDihapus: number;
  draftDihapus: boolean;
}

/** Remove only sample entries; real content and real drafts stay untouched. */
export function bersihkanDataContoh(storage: Penyimpanan): HasilBersih {
  let kontenDihapus = 0;
  let draftDihapus = false;

  try {
    const raw = storage.getItem(KEY_KONTEN);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const bersih = parsed.filter((entry) => !adalahKontenDummy(entry));
        kontenDihapus = parsed.length - bersih.length;
        if (kontenDihapus > 0) storage.setItem(KEY_KONTEN, JSON.stringify(bersih));
      }
    }
  } catch {
    // penyimpanan rusak: jangan hapus apa pun
  }

  try {
    const rawDraft = storage.getItem(KEY_DRAFT);
    if (rawDraft && adalahDraftDummy(JSON.parse(rawDraft))) {
      storage.removeItem(KEY_DRAFT);
      draftDihapus = true;
    }
  } catch {
    // penyimpanan rusak: draft dibiarkan
  }

  return { kontenDihapus, draftDihapus };
}
