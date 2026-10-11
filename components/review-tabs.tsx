"use client";

/**
 * ReviewTabs (UI-Spec 3.9 / 4): one tab per content status, each showing how
 * many items it holds. Tabs scroll horizontally on small screens instead of
 * wrapping, per UI-Spec 3.9.
 */
import { cn } from "@/lib/utils";

export interface TabDef {
  value: string;
  label: string;
  jumlah: number;
}

export function ReviewTabs({
  tabs,
  aktif,
  onSelect,
}: {
  tabs: TabDef[];
  aktif: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Antrian review per status"
      className="flex gap-1 overflow-x-auto border-b border-surface-border pb-px"
    >
      {tabs.map((t) => {
        const dipilih = t.value === aktif;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={dipilih}
            onClick={() => onSelect(t.value)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-t-lg px-3 py-2 text-sm transition-colors",
              dipilih
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full border border-surface-border px-1.5 py-0.5 text-xs tabular-nums",
                dipilih ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t.jumlah}
            </span>
          </button>
        );
      })}
    </div>
  );
}
