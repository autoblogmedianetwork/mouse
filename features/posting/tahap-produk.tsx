"use client";

/**
 * Tahap 1: Penawaran (refactor R3). JSX dipindah utuh dari
 * alur-buat-posting.tsx; semua state tetap di use-draft-posting.
 */
import { Card } from "@/components/card";
import { KartuQuickCapture } from "./kartu-quick-capture";
import { FormPenawaran } from "./form-penawaran";
import type { SavedProduct } from "./form-produk-manual";
import { formatRupiah, komisiPerUnit } from "@/lib/kalkulator/kalkulator-cuan";
import type { DraftState, Langkah } from "./draft-posting";
import { nilaiFormDariPrefill, type PrefillProduk } from "@/lib/impor/prefill";

interface Props {
  prefill: PrefillProduk | null;
  nilaiAwalProduk?: ReturnType<typeof nilaiFormDariPrefill>;
  produk: SavedProduct | null;
  analisisManual: string;
  update: (patch: Partial<DraftState>) => void;
  setPesan: (p: string | null) => void;
  setLangkah: (l: Langkah) => void;
}

export function TahapProduk({ prefill, nilaiAwalProduk, produk, analisisManual, update, setPesan, setLangkah }: Props) {
  // Kalkulator Cuan: harga produk aktif sebagai angka (string form bisa "150000").
  const hargaProduk = Number(produk?.harga ?? 0);

  return (
    <div className="space-y-6">
      {prefill ? (
        <div className="border border-primary/40 bg-primary/5 px-4 py-3 text-badan font-mono">
          <p className="font-medium text-meta uppercase">[ DATA DARI QUICK CAPTURE ]</p>
          <p className="mt-1 text-muted-foreground text-meta">
            Isian di bawah diambil dari halaman yang Anda tandai
            {prefill.sumber ? ` di ${prefill.sumber}` : ""}. Periksa dan lengkapi
            dulu; penawaran baru tersimpan setelah Anda menekan “Simpan penawaran”.
          </p>
        </div>
      ) : null}
      <FormPenawaran
        nilaiAwal={nilaiAwalProduk}
        onSaved={(penawaran) => {
          update({
            produk: penawaran,
            analisisManual:
              penawaran.deskripsi_bersih || penawaran.deskripsi || penawaran.nama_internal,
            status: "draft",
          });
          setPesan("Penawaran tersimpan. Silakan pilih 'Lanjut ke analisis' atau 'Lewati ke ide'.");
        }}
      />
      <KartuQuickCapture />
      {produk ? (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-meta font-mono font-semibold uppercase tracking-meta text-muted-foreground">
                [ PENAWARAN AKTIF ]
              </h2>
              <p className="mt-1 text-badan font-medium">
                {produk.nama_internal}
                {produk.harga ? ` (${produk.harga})` : ""}
              </p>
              {produk.url_referensi ? (
                <p className="text-meta font-mono text-muted-foreground truncate max-w-md mt-0.5">
                  {produk.url_referensi}
                </p>
              ) : null}
              {hargaProduk > 0 ? (
                <p className="mt-1 text-meta text-muted-foreground">
                  Estimasi komisi @10%:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {formatRupiah(komisiPerUnit(hargaProduk, 10))}
                  </span>{" "}
                  / penjualan — lengkapnya di Kalkulator Cuan di Dashboard.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="h-9 px-4 border border-surface-border bg-muted/60 hover:bg-muted text-meta font-mono uppercase font-medium transition-colors"
                onClick={() => {
                  if (!analisisManual) {
                    update({
                      analisisManual:
                        produk.deskripsi_bersih ||
                        produk.deskripsi ||
                        produk.nama_internal ||
                        "",
                    });
                  }
                  setLangkah("ide");
                }}
              >
                Lewati ke ide &gt;&gt;
              </button>
              <button
                type="button"
                className="h-9 px-4 bg-primary text-primary-foreground text-meta font-mono uppercase font-semibold hover:bg-primary-hover transition-colors"
                onClick={() => setLangkah("analisis")}
              >
                Lanjut ke analisis &gt;&gt;
              </button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
