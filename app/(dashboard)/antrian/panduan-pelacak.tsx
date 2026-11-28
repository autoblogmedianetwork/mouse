"use client";

/**
 * Panduan kode pelacak di halaman Antrian.
 *
 * Pengguna sering menyalin kode `at-xxxxxx` lalu tidak tahu harus diapakan.
 * Blok ini menjawab tiga hal: di mana menempel, bentuk kolomnya di Shopee, dan
 * satu larangan yang paling mudah dilanggar (memendekkan link affiliate).
 * Teksnya tinggal di lib/performa/panduan-sub-id.ts supaya bisa diuji.
 */
import { useState } from "react";
import { PANDUAN_SUB_ID } from "@/lib/performa/panduan-sub-id";

export function PanduanPelacak() {
  const [buka, setBuka] = useState(false);

  return (
    <div className="border border-surface-border bg-surface px-3.5 py-2.5">
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        className="flex w-full items-center justify-between gap-2 text-left text-meta"
      >
        <span className="font-medium">Cara memakai kode pelacak (sub_id)</span>
        <span className="text-muted-foreground">{buka ? "Tutup" : "Buka"}</span>
      </button>

      {buka ? (
        <div className="mt-2 space-y-1.5 text-meta text-muted-foreground">
          <p>{PANDUAN_SUB_ID.tempat}</p>
          <p>{PANDUAN_SUB_ID.format}</p>
          <p className="text-warning">{PANDUAN_SUB_ID.larangan}</p>
        </div>
      ) : null}
    </div>
  );
}
