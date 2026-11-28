"use client";

/**
 * Rangking sudut konten (adaptasi kerangka "content-angle-ranker").
 *
 * Menjawab satu pertanyaan: sudut mana yang harus dikerjakan lagi besok.
 * Datanya dari atribusi yang sudah ada (komisi cair per sudut), bukan tebakan.
 * Prinsip sama dengan rekomendasi performa: kalau data tipis, bilang tipis.
 */
import { useMemo } from "react";
import { Card } from "@/components/card";
import { TabelResponsif } from "@/components/tabel-responsif";
import { cn } from "@/lib/utils";
import { useAtribusi } from "@/features/performa/use-atribusi";
import { rangkingAngle, type Putusan } from "@/lib/performa/rangking-angle";

const GAYA_PUTUSAN: Record<Putusan, string> = {
  lanjutkan: "border-status-ready/50 text-status-ready",
  "uji-lagi": "border-surface-border text-muted-foreground",
  "ganti-sudut": "border-warning/50 text-warning",
  "belum-data": "border-surface-border text-muted-foreground",
};

const LABEL_PUTUSAN: Record<Putusan, string> = {
  lanjutkan: "Lanjutkan",
  "uji-lagi": "Uji lagi",
  "ganti-sudut": "Ganti sudut",
  "belum-data": "Belum ada data",
};

const rupiah = (nilai: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);

export function RangkingAnglePanel() {
  const atribusi = useAtribusi();
  const peringkat = useMemo(
    () => (atribusi.siap ? rangkingAngle(atribusi.hasil.per_angle) : []),
    [atribusi.siap, atribusi.hasil],
  );

  if (!atribusi.siap) return null;
  if (peringkat.length === 0) return null;

  return (
    <Card>
      <h2 className="text-isi font-semibold">Rangking sudut konten</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Diurutkan dari sudut yang paling layak dikerjakan lagi, memakai komisi yang benar-benar
        cair. Sudut dengan data tipis tidak dipaksa disimpulkan.
      </p>

      <div className="mt-3">
        <TabelResponsif
          caption="Rangking sudut konten berdasarkan komisi cair"
          kolom={["Sudut", "Konten", "Klik", "Komisi cair", "Rp/klik", "Keyakinan", "Putusan"]}
          baris={peringkat.map((p) => ({
            kunci: p.angle,
            sel: [
              {
                isi: (
                  <span className="block">
                    <span className="font-medium">{p.angle}</span>
                    <span className="mt-0.5 block text-meta text-muted-foreground">{p.alasan}</span>
                  </span>
                ),
              },
              { isi: p.konten, kelasTabel: "tabular-nums" },
              { isi: p.klik, kelasTabel: "tabular-nums" },
              { isi: rupiah(p.komisi_cair), kelasTabel: "tabular-nums" },
              {
                isi: p.klik > 0 ? rupiah(p.rupiah_per_klik) : "—",
                kelasTabel: "tabular-nums",
              },
              { isi: p.keyakinan },
              {
                isi: (
                  <span
                    className={cn("border px-1.5 py-0.5 text-meta font-medium", GAYA_PUTUSAN[p.putusan])}
                  >
                    {LABEL_PUTUSAN[p.putusan]}
                  </span>
                ),
              },
            ],
          }))}
        />
      </div>
    </Card>
  );
}
