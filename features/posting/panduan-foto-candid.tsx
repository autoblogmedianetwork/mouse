"use client";

import { panduanFotoCandid, type ProdukUntukPanduan } from "@/lib/produk/panduan-foto";

/**
 * Panduan foto candid (N-7). Teks statis dari data produk: tanpa AI, tanpa
 * link, dan tanpa harga. Muncul di tahap Preview sebagai bekal sebelum user
 * memotret sendiri.
 */
export function PanduanFotoCandid({ produk }: { produk: ProdukUntukPanduan }) {
  const panduan = panduanFotoCandid(produk);

  return (
    <section className="mt-4 rounded-xl border border-surface-border bg-surface p-4">
      <h3 className="text-sm font-semibold">{panduan.judul}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{panduan.ringkas}</p>
      <ol className="mt-3 space-y-2">
        {panduan.langkah.map((langkah, index) => (
          <li key={index} className="flex gap-2 text-xs leading-5">
            <span className="text-muted-foreground tabular-nums">{index + 1}.</span>
            <span>{langkah}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        Panduan ini tidak membuat gambar dan tidak menyimpan apa pun; semua foto
        diambil dan diunggah sendiri oleh user.
      </p>
    </section>
  );
}
