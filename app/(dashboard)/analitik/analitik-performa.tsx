"use client";

/**
 * Analitik performa dari laporan affiliate yang diimpor (Fase 6 lebih awal).
 * Semua angka berasal dari baris impor, bukan estimasi.
 */
import Link from "next/link";
import { useMemo } from "react";
import { EmptyState } from "@/components/empty-state";
import { MARKETPLACE_LABEL } from "@/lib/impor/marketplace";
import { formatAngka, formatRupiah } from "@/lib/impor/normalisasi";
import { ringkasPerforma } from "@/lib/impor/performa";
import { PerformaLengkap } from "@/features/impor/performa-ringkas";
import { usePerforma } from "@/features/impor/use-performa";
import { BagianPerformaKonten } from "@/features/performa/performa-konten";

export function AnalitikPerforma() {
  const { simpanan, siap } = usePerforma();
  const ringkas = useMemo(() => ringkasPerforma(simpanan.baris), [simpanan.baris]);

  if (!siap) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface p-6 text-sm text-muted-foreground">
        Memuat data performa…
      </div>
    );
  }

  if (simpanan.baris.length === 0) {
    return (
      <EmptyState
        title="Belum ada data performa"
        description="Analitik dihitung dari laporan komisi Shopee, TikTok Shop, atau Tokopedia yang Anda impor. Impor satu laporan, lalu halaman ini menampilkan komisi, GMV, produk terlaris, dan tren bulanan."
        actionLabel="Impor laporan pertama"
        actionHref="/impor"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PerformaLengkap ringkas={ringkas} />

      <BagianPerformaKonten lengkap />

      <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Sumber data</h2>
          <Link href="/impor" className="text-sm text-primary underline-offset-2 hover:underline">
            Tambah laporan
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-surface-border">
          {simpanan.sumber.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <span className="min-w-0 truncate font-medium">{s.nama}</span>
              <span className="text-xs text-muted-foreground">
                {MARKETPLACE_LABEL[s.marketplace]} · {formatAngka(s.baris)} baris ·{" "}
                {formatRupiah(s.komisi)} · {new Date(s.diimpor_pada).toLocaleDateString("id-ID")}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Data ini tersimpan di peramban Anda. Setelah login Supabase aktif, baris yang sama akan
          disinkronkan ke tabel performa.
        </p>
      </section>
    </div>
  );
}
