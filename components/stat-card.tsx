import { cn } from "@/lib/utils";

/**
 * StatCard (UI-Spec 4) — angka telemetri bergaya Swiss Industrial Print:
 * kartu bersudut 90 derajat, label monospace uppercase, angka tabular besar
 * dengan garis pembatas di bawah nilai.
 */
export function StatCard({
  label,
  nilai,
  catatan,
  tone = "netral",
}: {
  label: string;
  nilai: number | string;
  catatan?: string;
  tone?: "netral" | "draft" | "siap";
}) {
  return (
    <div className="border-2 border-foreground bg-surface p-4 sm:p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 border-b border-surface-border pb-2 text-3xl font-bold tabular-nums tracking-tight",
          tone === "draft" && "text-status-draft",
          tone === "siap" && "text-status-ready",
        )}
      >
        {nilai}
      </p>
      {catatan ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
          {catatan}
        </p>
      ) : null}
    </div>
  );
}
