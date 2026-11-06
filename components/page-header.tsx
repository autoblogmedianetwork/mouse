/**
 * PageHeader — judul halaman bergaya Swiss Industrial Print (ADR 0009, ADR
 * 0013): huruf hitam berat uppercase dengan tracking negatif dan garis
 * pembatas tegas di bawah blok judul.
 *
 * The static "HALAMAN ///" meta was removed in pass 3; the real breadcrumb
 * (Workspace › Halaman) now lives in the AppShell topbar, so printing a
 * meaningless marker on all 14 pages is gone.
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
          <h1 className="text-hero font-black uppercase leading-[0.95] tracking-[-0.03em]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-badan text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      </div>
    </div>
  );
}
