import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * EmptyState — blok kosong bergaya blueprint: area putus-putus bersudut 90
 * derajat dengan metadata monospace, bukan kartu membulat.
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
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-foreground/40 bg-surface px-6 py-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        [ KOSONG ]
      </p>
      <p className="mt-2 text-base font-bold uppercase tracking-tight">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className={cn(
            "mt-4 inline-flex h-11 items-center border-2 border-foreground bg-primary px-4",
            "font-mono text-xs font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-colors hover:bg-primary-hover",
          )}
        >
          {actionLabel} &gt;&gt;&gt;
        </Link>
      ) : null}
    </div>
  );
}
