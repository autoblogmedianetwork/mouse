"use client";

/**
 * TabelResponsif — satu sumber data, dua tampilan (Tahap 3, AUDIT-RESPONSIF).
 *
 * Tabel lebar (min-w 544–864px) meluber di layar 360–430px. Komponen ini
 * menampilkan tabel penuh hanya pada sm: ke atas, dan kartu bertumpuk di
 * bawah sm. Kedua tampilan dibangun dari array `baris` yang sama, jadi
 * tidak ada kolom yang bisa hilang di salah satu tampilan.
 *
 * Kartu mengikuti ADR 0013: sudut siku (tanpa sudut membulat), border-2
 * border-foreground, latar surface. Sel pertama menjadi judul kartu; sel
 * lain tampil sebagai pasangan label–nilai.
 */
import { cn } from "@/lib/utils";

/** Satu sel: konten yang sama dipakai di tabel dan di kartu. */
export type SelTabel = {
  isi: React.ReactNode;
  /** Kelas tambahan untuk sel tabel (td). */
  kelasTabel?: string;
  /** Kelas tambahan untuk blok nilai di kartu. */
  kelasKartu?: string;
};

export type BarisTabel = {
  /** Kunci unik baris (React key). */
  kunci: string;
  /** Sel-sel baris, urutannya sama dengan `kolom`. */
  sel: SelTabel[];
};

export function TabelResponsif({
  kolom,
  baris,
  caption,
  kelasTabel,
  kelasKartu,
}: {
  /** Label kolom, urutannya sama dengan `sel` tiap baris. */
  kolom: readonly string[];
  baris: readonly BarisTabel[];
  /** Teks sr-only yang menggantikan caption tabel. */
  caption: string;
  /** Kelas tambahan untuk elemen tabel (mis. varian teks). */
  kelasTabel?: string;
  /** Kelas tambahan untuk wadah kartu. */
  kelasKartu?: string;
}) {
  return (
    <>
      {/* Desktop: tabel penuh, hanya pada sm: ke atas. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className={cn("w-full text-badan", kelasTabel)}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-surface-border text-left font-mono text-meta uppercase tracking-meta text-muted-foreground">
              {kolom.map((label) => (
                <th key={label} className="py-2 pr-3 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.kunci} className="border-b border-surface-border align-top">
                {b.sel.map((s, i) => (
                  <td key={i} className={cn("py-2.5 pr-3", s.kelasTabel)}>
                    {s.isi}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile: kartu bertumpuk, baris dan kolom yang sama. */}
      <div className={cn("space-y-3 sm:hidden", kelasKartu)}>
        {baris.map((b) => (
          <div key={b.kunci} className="border-2 border-foreground bg-surface p-3">
            <div className="min-w-0 font-medium">{b.sel[0].isi}</div>
            <dl className="mt-2 space-y-1.5">
              {b.sel.slice(1).map((s, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[minmax(7rem,auto)_1fr] items-baseline gap-x-2"
                >
                  <dt className="font-mono text-meta uppercase tracking-meta text-muted-foreground">
                    {kolom[i + 1]}
                  </dt>
                  <dd className={cn("min-w-0 text-badan", s.kelasKartu)}>{s.isi}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
