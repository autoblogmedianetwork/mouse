import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * EmptyState — blok kosong bergaya blueprint: area putus-putus bersudut 90
 * derajat dengan metadata monospace, bukan kartu membulat. Tombol aksi
 * memakai suara tombol standar aplikasi (sans, tanpa >>>) dan full-width di
 * HP supaya mudah dijangkau jempol (temuan critique).
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-foreground/70 bg-surface px-6 py-12 text-center sm:py-16">
      <p className="font-mono text-meta uppercase tracking-meta text-muted-foreground">
        [ KOSONG ]
      </p>
      <p className="mt-2 text-isi font-bold uppercase tracking-tight">{title}</p>
      <p className="mt-1 max-w-sm text-badan text-muted-foreground">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className={cn(
            "mt-4 inline-flex h-11 w-full items-center justify-center border-2 border-foreground bg-primary px-4",
            "text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto",
          )}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
