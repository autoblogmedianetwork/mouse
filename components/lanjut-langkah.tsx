"use client";

/**
 * Tombol "Lanjut ke langkah berikutnya" (Gelombang 5).
 *
 * Menutup alur kerja 4 langkah langsung dari halaman tempat user selesai:
 * setelah menyimpan produk di Riset, tombol di sini mengantarnya ke Bikin
 * Konten; setelah konten jadi, ke Terbit. Dipasang oleh masing-masing halaman
 * dengan `dari` = langkah asal.
 */
import Link from "next/link";
import { LANGKAH_ALUR } from "@/components/nav-config";

export function LanjutLangkah({ dari }: { dari: number }) {
  const urut = [...LANGKAH_ALUR].sort((a, b) => a.nomor - b.nomor);
  const sekarang = urut.find((l) => l.nomor === dari);
  const berikut = urut.find((l) => l.nomor === dari + 1);
  if (!sekarang || !berikut) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-primary bg-primary/5 p-3">
      <div className="min-w-0">
        <p className="font-mono text-mikro uppercase tracking-meta text-muted-foreground">
          Langkah {sekarang.nomor} selesai
        </p>
        <p className="text-badan font-medium">
          Lanjut ke langkah {berikut.nomor}: {berikut.label}
        </p>
        <p className="text-meta text-muted-foreground">{berikut.kapan}</p>
      </div>
      <Link
        href={berikut.href}
        className="inline-flex h-10 shrink-0 items-center bg-primary px-4 text-badan font-medium text-primary-foreground hover:opacity-90"
      >
        {berikut.label} →
      </Link>
    </div>
  );
}
