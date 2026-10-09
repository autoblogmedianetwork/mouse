"use client";

/**
 * ChecklistGate (UI-Spec 3.2 checkpoint): all boxes must be ticked before
 * "Tandai siap posting" becomes available.
 */

export const CHECKLIST_ITEMS = [
  { id: "produk", label: "Produk di media sesuai listing." },
  { id: "klaim", label: "Tidak ada klaim yang tidak bisa dibuktikan." },
  { id: "kekurangan", label: "Ada satu status yang menyebut kekurangan produk (jika aturan kepercayaan aktif)." },
  { id: "link", label: "Link sudah diuji." },
  { id: "disclosure", label: "Disclosure affiliate sudah ada." },
] as const;

export type ChecklistId = (typeof CHECKLIST_ITEMS)[number]["id"];

export function ChecklistGate({
  nilai,
  onChange,
  aturanKepercayaanAktif = true,
}: {
  nilai: Record<ChecklistId, boolean>;
  onChange: (id: ChecklistId, checked: boolean) => void;
  aturanKepercayaanAktif?: boolean;
}) {
  const items = CHECKLIST_ITEMS.filter(
    (item) => item.id !== "kekurangan" || aturanKepercayaanAktif,
  );
  const selesai = items.filter((item) => nilai[item.id]).length;

  return (
    <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Checklist sebelum siap posting</h2>
        <span className="text-xs text-muted-foreground">
          {selesai}/{items.length} selesai
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={nilai[item.id]}
                onChange={(e) => onChange(item.id, e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
              />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Semua output AI tetap berstatus draft sampai Anda menekan “Tandai siap
        posting” (PRD F0).
      </p>
    </section>
  );
}
