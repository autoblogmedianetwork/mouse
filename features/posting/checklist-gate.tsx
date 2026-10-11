"use client";

/**
 * ChecklistGate (UI-Spec 3.2 checkpoint): all boxes must be ticked before
 * "Tandai siap posting" becomes available.
 *
 * The item list lives in lib/konten/checklist.ts because Antrian review (F10)
 * applies the same rules to bulk "tandai siap".
 */
import { CHECKLIST_ITEMS as CHECKLIST_ITEM_LIST, type ChecklistId } from "@/lib/konten/checklist";

export const CHECKLIST_ITEMS = CHECKLIST_ITEM_LIST;
export type { ChecklistId };

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
