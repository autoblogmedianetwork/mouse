"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { TabelResponsif, type BarisTabel } from "@/components/tabel-responsif";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  RIWAYAT_FILTER_AWAL,
  filterRiwayat,
  muatRiwayat,
  type RiwayatFilter,
} from "@/lib/konten/riwayat";
import { useLocalState } from "@/lib/konten/use-local-state";
import { cn } from "@/lib/utils";

const inputClass =
  "border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";

/**
 * Riwayat Posting (UI-Spec 3.5): time, content, mode, final status, notes.
 * Seeded by actions in Buat posting (mark ready, copy thread). Auto-posting
 * status arrives at M6 (F8) — mode is always "manual" in MVP.
 */
export function TabelRiwayat() {
  // muatRiwayat dipanggil sekali saat mount sebagai isi awal state.
  const [riwayat] = useLocalState("autothreads-riwayat", [] as ReturnType<typeof muatRiwayat>);
  const [filter, setFilter] = useState<RiwayatFilter>(RIWAYAT_FILTER_AWAL);

  const hasil = useMemo(() => filterRiwayat(riwayat, filter), [riwayat, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-badan">
          Dari
          <input
            type="date"
            value={filter.dari}
            onChange={(e) => setFilter({ ...filter, dari: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-badan">
          Sampai
          <input
            type="date"
            value={filter.sampai}
            onChange={(e) => setFilter({ ...filter, sampai: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-badan">
          Status
          <select
            value={filter.status}
            onChange={(e) =>
              setFilter({ ...filter, status: e.target.value as RiwayatFilter["status"] })
            }
            className={inputClass}
          >
            <option value="semua">Semua</option>
            <option value="draft">Draft</option>
            <option value="siap_posting">Siap posting</option>
            <option value="terjadwal">Terjadwal</option>
            <option value="terkirim">Terkirim</option>
            <option value="gagal">Gagal</option>
          </select>
        </label>
      </div>

      {hasil.length === 0 ? (
        <EmptyState
          title="Riwayat masih kosong"
          description="Riwayat terisi saat Anda menandai konten siap posting atau menyalin utas di halaman Buat posting. Postingan otomatis (M6) juga akan tercatat di sini."
          actionLabel="Buka Buat posting"
          actionHref="/posting/baru"
        />
      ) : (
        <Card padat>
          <TabelResponsif
            kolom={["Waktu", "Konten", "Mode", "Status akhir", "Catatan"]}
            caption="Riwayat posting: waktu, mode, dan status akhir"
            baris={hasil.map(
              (e): BarisTabel => ({
                kunci: e.id,
                sel: [
                  {
                    isi: new Date(e.waktu).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                    kelasTabel: "whitespace-nowrap text-meta tabular-nums text-muted-foreground",
                  },
                  { isi: e.konten_judul, kelasTabel: "font-medium" },
                  {
                    isi: (
                      <span
                        className={cn(
                          "border border-surface-border bg-muted px-2 py-0.5 font-mono text-mikro font-semibold uppercase tracking-badge",
                          e.mode === "auto" && "text-status-scheduled",
                        )}
                      >
                        {e.mode === "auto" ? "Auto" : "Manual"}
                      </span>
                    ),
                  },
                  { isi: <StatusBadge status={e.status_akhir} /> },
                  { isi: e.catatan, kelasTabel: "text-meta text-muted-foreground" },
                ],
              }),
            )}
          />
        </Card>
      )}

      <p className="text-meta text-muted-foreground">
        Status API (terkirim/gagal otomatis) masuk di M6 sesuai PRD F8.
      </p>
    </div>
  );
}
