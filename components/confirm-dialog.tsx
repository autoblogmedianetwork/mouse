"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * ConfirmDialog (UI-Spec 4): always used for actions that cannot be undone
 * (delete, reschedule). Native <dialog> for focus trapping and Esc handling.
 */
export function ConfirmDialog({
  open,
  judul,
  pesan,
  labelKonfirmasi = "Hapus",
  onKonfirmasi,
  onBatal,
  destructive = true,
}: {
  open: boolean;
  judul: string;
  pesan: string;
  labelKonfirmasi?: string;
  onKonfirmasi: () => void;
  onBatal: () => void;
  destructive?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onBatal();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-xl border border-surface-border bg-surface p-0 text-foreground backdrop:bg-black/50"
    >
      <div className="p-5">
        <h2 className="text-base font-semibold">{judul}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{pesan}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onBatal}
            className="h-9 rounded-lg border border-surface-border px-4 text-sm font-medium hover:bg-muted"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onKonfirmasi}
            autoFocus
            className={cn(
              "h-9 rounded-lg px-4 text-sm font-medium text-primary-foreground transition-colors",
              destructive
                ? "bg-status-failed hover:opacity-90"
                : "bg-primary hover:bg-primary-hover",
            )}
          >
            {labelKonfirmasi}
          </button>
        </div>
      </div>
    </dialog>
  );
}
