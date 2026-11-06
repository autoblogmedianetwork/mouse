"use client";

import { Card } from "@/components/card";
import { panduanFotoCandid, type ProdukUntukPanduan } from "@/lib/produk/panduan-foto";

/**
 * Panduan foto candid (N-7). Teks statis dari data produk: tanpa AI, tanpa
 * link, dan tanpa harga. Muncul di tahap Preview sebagai bekal sebelum user
 * memotret sendiri.
 */
export function PanduanFotoCandid({ produk }: { produk: ProdukUntukPanduan }) {
  const panduan = panduanFotoCandid(produk);

  return (
    <Card padat className="mt-4 p-4">
      <h3 className="text-badan font-semibold">{panduan.judul}</h3>
      <p className="mt-1 text-meta text-muted-foreground">{panduan.ringkas}</p>
      <ol className="mt-3 space-y-2">
        {panduan.langkah.map((langkah, index) => (
          <li key={index} className="flex gap-2 text-meta leading-5">
            <span className="text-muted-foreground tabular-nums">{index + 1}.</span>
            <span>{langkah}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-meta text-muted-foreground">
        Panduan ini tidak membuat gambar dan tidak menyimpan apa pun; semua foto
        diambil dan diunggah sendiri oleh user.
      </p>
    </Card>
  );
}
