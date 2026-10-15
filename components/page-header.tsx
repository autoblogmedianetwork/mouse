/**
 * PageHeader — judul halaman bergaya Swiss Industrial Print (ADR 0009):
 * huruf hitam berat uppercase dengan tracking negatif, meta monospace di
 * atasnya, dan garis pembatas tegas di bawah blok judul.
 */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b-2 border-foreground pb-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            HALAMAN ///
          </p>
          <h1 className="mt-1 text-[clamp(1.75rem,5vw,2.75rem)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      </div>
    </div>
  );
}
