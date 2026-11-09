import { cn } from "@/lib/utils";

/**
 * InfoHint — tanda tanya kecil di samping label yang menjelaskan istilah
 * saat di-hover/difokus. Murni CSS (title + focus ring), tanpa dependency
 * baru: pemula tidak perlu keluar aplikasi untuk paham istilah.
 */
export function InfoHint({
  text,
  className,
}: {
  /** Penjelasan singkat satu-dua kalimat, bahasa sehari-hari. */
  text: string;
  className?: string;
}) {
  return (
    <span
      role="note"
      tabIndex={0}
      aria-label={text}
      title={text}
      className={cn(
        "inline-flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full",
        "border border-surface-border font-mono text-[10px] leading-none text-muted-foreground",
        "focus:outline focus:outline-2 focus:outline-primary",
        className,
      )}
    >
      ?
    </span>
  );
}
