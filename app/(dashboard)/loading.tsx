/** Global loading state for dashboard navigation (UI-Spec 5.2). */
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-7 w-52 bg-muted" />
      <div className="h-4 w-80 max-w-full bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 border border-surface-border bg-surface" />
        ))}
      </div>
      <div className="h-64 border border-surface-border bg-surface" />
      <p className="text-meta text-muted-foreground">Memuat halaman…</p>
    </div>
  );
}
