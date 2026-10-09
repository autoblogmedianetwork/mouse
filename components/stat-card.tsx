import { cn } from "@/lib/utils";

/**
 * StatCard (UI-Spec 4): number with label and optional trend/secondary note.
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
    <div className="rounded-xl border border-surface-border bg-surface p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold tabular-nums",
          tone === "draft" && "text-status-draft",
          tone === "siap" && "text-status-ready",
        )}
      >
        {nilai}
      </p>
      {catatan ? <p className="mt-1 text-xs text-muted-foreground">{catatan}</p> : null}
    </div>
  );
}
