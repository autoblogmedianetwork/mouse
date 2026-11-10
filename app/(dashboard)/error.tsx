"use client";

/** Global error boundary for dashboard pages (UI-Spec 5.2). */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-judul font-semibold">Halaman gagal dimuat</h1>
      <p className="text-badan text-muted-foreground">
        Terjadi kesalahan saat memuat halaman ini. Data yang sudah tersimpan tidak berubah.
      </p>
      <p className="border border-status-failed bg-status-failed/10 px-3 py-2 text-meta text-status-failed">
        {error.message || "Kesalahan tidak dikenal."}
        {error.digest ? ` (kode ${error.digest})` : ""}
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-9 bg-primary px-4 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Coba lagi
      </button>
    </div>
  );
}
