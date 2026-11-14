"use client";

/**
 * Hapus data percobaan (Pengaturan).
 *
 * User sering mencoba fitur lalu meninggalkan data contoh. Panel ini
 * menampilkan pengelompokan data localStorage Heaviliate beserta ukurannya,
 * supaya bisa dibersihkan per kelompok tanpa menghapus pengaturan yang sudah
 * benar. Kunci milik aplikasi lain tidak pernah disentuh (lihat
 * lib/pengaturan/hapus-data.ts).
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/card";
import {
  KELOMPOK_DATA,
  formatByte,
  kunciKelompok,
  semuaKunciHeaviliate,
  ukuranKelompok,
  type KelompokData,
} from "@/lib/pengaturan/hapus-data";

const tombol =
  "inline-flex h-9 items-center border border-surface-border px-3 text-meta font-medium hover:bg-muted";

function daftarKunciStorage(): string[] {
  try {
    const hasil: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k) hasil.push(k);
    }
    return hasil;
  } catch {
    return [];
  }
}

function hitung(kelompok: KelompokData, kunci: readonly string[]): number {
  return ukuranKelompok(kelompok, (k) => window.localStorage.getItem(k), kunci);
}

export function HapusData() {
  const [kunci, setKunci] = useState<string[]>([]);
  const [ukuran, setUkuran] = useState<Record<string, number>>({});
  const [pilih, setPilih] = useState<Set<string>>(new Set());
  const [konfirmasi, setKonfirmasi] = useState<"tidak" | "kelompok" | "semua">("tidak");
  const [pesan, setPesan] = useState<string | null>(null);

  const muatUlang = () => {
    const semua = daftarKunciStorage();
    setKunci(semua);
    const baru: Record<string, number> = {};
    for (const k of KELOMPOK_DATA) baru[k.id] = hitung(k, semua);
    setUkuran(baru);
  };

  // Hidrasi setelah mount: localStorage tidak ada saat render server.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi localStorage harus setelah mount
    muatUlang();
  }, []);

  const totalHeaviliate = semuaKunciHeaviliate(kunci).reduce(
    (t, k) => t + (k.length + (window.localStorage.getItem(k)?.length ?? 0)) * 2,
    0,
  );

  const alih = (id: string) => {
    const baru = new Set(pilih);
    if (baru.has(id)) baru.delete(id);
    else baru.add(id);
    setPilih(baru);
    setKonfirmasi("tidak");
    setPesan(null);
  };

  const hapusKelompok = () => {
    const dihapus: string[] = [];
    for (const kelompok of KELOMPOK_DATA) {
      if (!pilih.has(kelompok.id)) continue;
      for (const k of kunciKelompok(kelompok, kunci)) {
        try {
          window.localStorage.removeItem(k);
          dihapus.push(k);
        } catch {
          // penyimpanan diblokir: lewati kunci ini
        }
      }
    }
    setPilih(new Set());
    setKonfirmasi("tidak");
    muatUlang();
    setPesan(`${dihapus.length} kunci data dihapus. Muat ulang halaman agar tampilan ikut bersih.`);
  };

  const hapusSemua = () => {
    const semua = semuaKunciHeaviliate(kunci);
    for (const k of semua) {
      try {
        window.localStorage.removeItem(k);
      } catch {
        // lewati
      }
    }
    setPilih(new Set());
    setKonfirmasi("tidak");
    muatUlang();
    setPesan(
      `Semua data Heaviliate di peramban ini dihapus (${semua.length} kunci). Pengaturan ikut kembali ke awal. Data di server tidak terhapus.`,
    );
  };

  const kosong = semuaKunciHeaviliate(kunci).length === 0;

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-isi font-semibold">Hapus data percobaan</h2>
        <p className="mt-1 text-meta text-muted-foreground">
          Data di bawah tersimpan di peramban ini (localStorage), bukan di server. Hapus yang
          tidak dipakai agar tidak menumpuk. Kunci milik aplikasi lain tidak pernah disentuh.
        </p>
      </div>

      <p className="text-meta">
        Total data Heaviliate di peramban ini:{" "}
        <strong className="font-mono">{formatByte(totalHeaviliate)}</strong>
      </p>

      {kosong ? (
        <p className="text-meta text-muted-foreground">Belum ada data tersimpan di peramban ini.</p>
      ) : (
        <div className="space-y-2">
          {KELOMPOK_DATA.map((kelompok) => {
            const jumlahKunci = kunciKelompok(kelompok, kunci).length;
            const dipilih = pilih.has(kelompok.id);
            return (
              <label
                key={kelompok.id}
                className={`flex cursor-pointer items-start gap-3 border p-2 ${
                  dipilih ? "border-primary bg-primary/5" : "border-surface-border"
                } ${jumlahKunci === 0 ? "opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={dipilih}
                  onChange={() => alih(kelompok.id)}
                  disabled={jumlahKunci === 0}
                  className="mt-1 h-4 w-4 accent-[var(--primary)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="text-badan font-medium">{kelompok.label}</span>
                    <span className="font-mono text-mikro uppercase text-muted-foreground">
                      {kelompok.ikon} · {jumlahKunci} kunci · {formatByte(ukuran[kelompok.id] ?? 0)}
                    </span>
                    {kelompok.risiko === "hati-hati" ? (
                      <span className="font-mono text-mikro uppercase text-status-failed">
                        penting
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-meta text-muted-foreground">
                    {kelompok.keterangan}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-surface-border pt-3">
        <button
          type="button"
          className={tombol}
          disabled={pilih.size === 0}
          onClick={() => setKonfirmasi("kelompok")}
        >
          Hapus yang dipilih ({pilih.size})
        </button>
        <button
          type="button"
          className={`${tombol} text-status-failed`}
          disabled={kosong}
          onClick={() => setKonfirmasi("semua")}
        >
          Hapus semua data Heaviliate
        </button>
      </div>

      {konfirmasi !== "tidak" ? (
        <div className="border border-status-failed p-3">
          <p className="text-badan font-medium">
            {konfirmasi === "semua"
              ? "Hapus SEMUA data Heaviliate di peramban ini?"
              : `Hapus ${pilih.size} kelompok data yang dipilih?`}
          </p>
          <p className="mt-1 text-meta text-muted-foreground">
            Tindakan ini tidak bisa dibatalkan. Sebaiknya unduh cadangan dulu lewat tombol
            Cadangkan di atas. Data yang sudah tersimpan di server (riset, peluang) tidak ikut
            terhapus.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center bg-status-failed px-3 text-meta font-medium text-white hover:opacity-90"
              onClick={konfirmasi === "semua" ? hapusSemua : hapusKelompok}
            >
              Ya, hapus sekarang
            </button>
            <button type="button" className={tombol} onClick={() => setKonfirmasi("tidak")}>
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {pesan ? (
        <p className="text-meta text-status-ready" role="status">
          {pesan}
        </p>
      ) : null}
    </Card>
  );
}
