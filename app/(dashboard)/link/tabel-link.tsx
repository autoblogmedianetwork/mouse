"use client";

import { useMemo } from "react";
import { EmptyState } from "@/components/empty-state";
import type { Konten } from "@/lib/konten/skema";
import { useLocalState } from "@/lib/konten/use-local-state";
import { cn } from "@/lib/utils";

/**
 * Link Affiliate (UI-Spec 3.6 / PRD F5): list links with manual click and
 * commission notes. No automatic Shopee tracking in MVP.
 * Links are derived from products that carry a url_referensi; klik/komisi
 * are editable per link and persisted separately from content.
 */

interface CatatanLink {
  klik: number;
  komisi: number;
}

const DEFAULT_CATATAN: CatatanLink = { klik: 0, komisi: 0 };

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm tabular-nums outline-none focus:border-primary";

interface BarisLink {
  url: string;
  produk: string;
  jumlahKonten: number;
  dibuat: string;
}

export function TabelLink() {
  const [konten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [catatan, setCatatan] = useLocalState<Record<string, CatatanLink>>("autothreads-link-catatan", {});

  const baris = useMemo(() => {
    const peta = new Map<string, BarisLink>();
    for (const k of konten) {
      if (!k.link_produk) continue;
      const existing = peta.get(k.link_produk);
      if (existing) {
        existing.jumlahKonten += 1;
      } else {
        peta.set(k.link_produk, {
          url: k.link_produk,
          produk: k.produk_nama || k.judul,
          jumlahKonten: 1,
          dibuat: k.created_at,
        });
      }
    }
    return [...peta.values()].sort((a, b) => b.jumlahKonten - a.jumlahKonten);
  }, [konten]);

  const ubah = (url: string, patch: Partial<CatatanLink>) => {
    setCatatan((prev) => ({
      ...prev,
      [url]: { ...DEFAULT_CATATAN, ...prev[url], ...patch },
    }));
  };

  const totalKlik = Object.values(catatan).reduce((s, c) => s + c.klik, 0);
  const totalKomisi = Object.values(catatan).reduce((s, c) => s + c.komisi, 0);
  const teratas = [...baris].sort(
    (a, b) => (catatan[b.url]?.klik ?? 0) - (catatan[a.url]?.klik ?? 0),
  )[0];

  if (baris.length === 0) {
    return (
      <EmptyState
        title="Belum ada link affiliate"
        description="Link yang terpasang pada konten (letak link selain “tanpa link”) otomatis muncul di sini. Catat klik dan komisi secara manual per PRD F5."
        actionLabel="Buka Buat posting"
        actionHref="/posting/baru"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-surface-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total klik</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{totalKlik}</p>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total komisi</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            Rp {totalKomisi.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Klik tertinggi
          </p>
          <p className="mt-1 truncate text-sm font-medium">
            {teratas && (catatan[teratas.url]?.klik ?? 0) > 0 ? teratas.produk : "—"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Produk</th>
              <th className="px-4 py-3 font-medium">Link</th>
              <th className="px-4 py-3 font-medium">Dibuat</th>
              <th className="px-4 py-3 font-medium">Konten</th>
              <th className="px-4 py-3 font-medium">Klik</th>
              <th className="px-4 py-3 font-medium">Komisi (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => {
              const c = catatan[b.url] ?? DEFAULT_CATATAN;
              return (
                <tr key={b.url} className="border-b border-surface-border last:border-0">
                  <td className="px-4 py-3 font-medium">{b.produk}</td>
                  <td className="max-w-[200px] px-4 py-3">
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {b.url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(b.dibuat).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{b.jumlahKonten}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={c.klik}
                      aria-label={`Klik untuk ${b.produk}`}
                      onChange={(e) =>
                        ubah(b.url, { klik: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className={cn(inputClass, "w-24")}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={c.komisi}
                      aria-label={`Komisi untuk ${b.produk}`}
                      onChange={(e) =>
                        ubah(b.url, { komisi: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className={cn(inputClass, "w-32")}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Tracking otomatis Shopee tidak masuk MVP karena akses API belum ada (PRD F5).
        Kolom Klik dan Komisi disimpan manual di browser ini.
      </p>
    </div>
  );
}
