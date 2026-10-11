/**
 * Checklist gate as a single source of truth (UI-Spec 3.2 checkpoint).
 *
 * Lives in lib/ because the Antrian review page (F10) must run the same rules
 * on bulk "tandai siap" as the single-content path in Buat posting. The UI
 * component in features/posting/checklist-gate.tsx renders this list.
 */

export const CHECKLIST_ITEMS = [
  { id: "produk", label: "Produk di media sesuai listing." },
  { id: "klaim", label: "Tidak ada klaim yang tidak bisa dibuktikan." },
  { id: "kekurangan", label: "Ada satu status yang menyebut kekurangan produk (jika aturan kepercayaan aktif)." },
  { id: "link", label: "Link sudah diuji." },
  { id: "disclosure", label: "Disclosure affiliate sudah ada." },
] as const;

export type ChecklistId = (typeof CHECKLIST_ITEMS)[number]["id"];

/** Every item starts unticked: nothing becomes siap_posting by default (PRD F0). */
export const CHECKLIST_AWAL: Record<ChecklistId, boolean> = {
  produk: false,
  klaim: false,
  kekurangan: false,
  link: false,
  disclosure: false,
};

export type ChecklistNilai = Record<ChecklistId, boolean>;

/** Items that must be ticked; "kekurangan" only when the trust rule is on. */
export function checklistWajib(aturanKepercayaanAktif: boolean): ChecklistId[] {
  return CHECKLIST_ITEMS.filter((i) => i.id !== "kekurangan" || aturanKepercayaanAktif).map(
    (i) => i.id,
  );
}

/**
 * Every required box ticked. Stored records carry whatever the user ticked, so
 * a record saved before this field existed reads as "not complete" and keeps
 * the draft-first rule intact.
 */
export function checklistLengkap(
  nilai: Partial<ChecklistNilai> | undefined,
  aturanKepercayaanAktif = true,
): boolean {
  if (!nilai) return false;
  return checklistWajib(aturanKepercayaanAktif).every((id) => nilai[id] === true);
}
