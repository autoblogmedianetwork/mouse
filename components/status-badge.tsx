import { cn } from "@/lib/utils";

export type ContentStatus =
  | "draft"
  | "siap_posting"
  | "terjadwal"
  | "terkirim"
  | "gagal"
  | "ditolak";

const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-status-draft border-surface-border",
  },
  siap_posting: {
    label: "Siap posting",
    className: "bg-muted text-status-ready border-surface-border",
  },
  terjadwal: {
    label: "Terjadwal",
    className: "bg-muted text-status-scheduled border-surface-border",
  },
  terkirim: {
    label: "Terkirim",
    className: "bg-muted text-status-sent border-surface-border",
  },
  gagal: {
    label: "Gagal",
    className: "bg-muted text-status-failed border-surface-border",
  },
  ditolak: {
    label: "Ditolak",
    className: "bg-muted text-status-failed border-surface-border",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ContentStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
