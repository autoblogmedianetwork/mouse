"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { ringkasanKonten, type Konten } from "@/lib/konten/skema";
import { useLocalState } from "@/lib/konten/use-local-state";
import { ringkasPerforma } from "@/lib/impor/performa";
import { PerformaRingkas } from "@/features/impor/performa-ringkas";
import { usePerforma } from "@/features/impor/use-performa";
import { BagianPerformaKonten } from "@/features/performa/performa-konten";

interface DraftRingkas {
  updatedAt?: string;
  status?: string;
  konten?: Array<{ ide?: { judul?: string } }>;
  produk?: { nama_internal?: string } | null;
}

/**
 * Dashboard summary (Fase 4): StatCards from the content bank plus the most
 * recent working draft ("lanjutkan draft").
 */
export function RingkasanDashboard() {
  const [konten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [draft] = useLocalState<DraftRingkas>("autothreads-draft-posting", {});
  const { simpanan: performa, siap: performaSiap } = usePerforma();

  const ringkas = useMemo(() => ringkasanKonten(konten), [konten]);
  const ringkasPerf = useMemo(() => ringkasPerforma(performa.baris), [performa.baris]);
  const adaPerforma = performa.baris.length > 0;

  const draftJudul =
    draft?.konten?.[0]?.ide?.judul ??
    draft?.produk?.nama_internal ??
    null;
  const adaDraft = Boolean(draftJudul) || (draft?.konten?.length ?? 0) > 0;

  if (konten.length === 0 && !adaDraft && !adaPerforma) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Belum ada konten"
          description="Mulai dari produk pertama: tempel link Shopee atau isi manual, lalu buat utas Threads dari hasilnya. Semua output berstatus draft sampai Anda menandainya siap posting."
          actionLabel="Mulai dari produk pertama"
          actionHref="/posting/baru"
        />
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya laporan komisi dari Shopee, TikTok Shop, atau Tokopedia?{" "}
          <Link href="/impor" className="text-primary underline-offset-2 hover:underline">
            Impor performa affiliate
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Konten total" nilai={ringkas.total} catatan="Tidak termasuk arsip" />
        <StatCard label="Draft" nilai={ringkas.draft} tone="draft" catatan="Sedang dikerjakan" />
        <StatCard label="Siap posting" nilai={ringkas.siap} tone="siap" catatan="Menunggu disalin ke Threads" />
        <StatCard label="Arsip" nilai={ringkas.arsip} catatan="Retensi 90 hari (K3)" />
      </div>

      {adaPerforma ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Performa affiliate</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Dihitung dari laporan Shopee, TikTok Shop, dan Tokopedia yang Anda impor.
              </p>
            </div>
            <Link href="/analitik" className="text-sm text-primary underline-offset-2 hover:underline">
              Buka Analitik
            </Link>
          </div>
          <PerformaRingkas ringkas={ringkasPerf} />
          <BagianPerformaKonten />
        </section>
      ) : performaSiap ? (
        <section className="rounded-xl border border-dashed border-surface-border bg-surface p-4 sm:p-6">
          <h2 className="text-base font-semibold">Hubungkan data affiliate Anda</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Unggah ekspor komisi dari Shopee Affiliate, TikTok Shop, atau Tokopedia Affiliate, lalu
            dashboard ini menampilkan komisi, GMV, dan produk terlaris dari data nyata.
          </p>
          <Link
            href="/impor"
            className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Impor laporan
          </Link>
        </section>
      ) : null}

      {adaDraft ? (
        <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lanjutkan draft terakhir
              </p>
              <p className="mt-1 text-sm font-semibold">{draftJudul ?? "Konten tanpa judul"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {draft?.produk?.nama_internal ? `Produk: ${draft.produk.nama_internal} · ` : ""}
                {draft?.updatedAt
                  ? `diubah ${new Date(draft.updatedAt).toLocaleString("id-ID")}`
                  : ""}
              </p>
            </div>
            <Link
              href="/posting/baru"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Lanjutkan
            </Link>
          </div>
        </section>
      ) : null}

      {konten.length > 0 ? (
        <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Konten terbaru</h2>
            <Link href="/konten" className="text-sm text-primary underline-offset-2 hover:underline">
              Lihat Pustaka
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-surface-border">
            {[...konten]
              .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
              .slice(0, 5)
              .map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{k.judul}</p>
                    <p className="text-xs text-muted-foreground">
                      {k.statuses.length} status ·{" "}
                      {new Date(k.updated_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <StatusBadge status={k.status} />
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
