"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import {
  LABEL_JENIS_CARI,
  cariGlobal,
  type HasilCari,
  type JenisHasilCari,
} from "@/lib/cari/cari-global";
import { useLocalState } from "@/lib/konten/use-local-state";
import type { Konten } from "@/lib/konten/skema";
import { BANK_KEY, type ItemBank } from "@/lib/riset/bank-masalah";
import { KEY_PRODUK, type ProdukRingkas } from "@/lib/produk/store";
import { cn } from "@/lib/utils";

const URUTAN_JENIS: JenisHasilCari[] = ["konten", "produk", "masalah"];

const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";

export function PencarianGlobal() {
  const [q, setQ] = useState("");
  const [konten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [produk] = useLocalState<ProdukRingkas[]>(KEY_PRODUK, []);
  const [bank] = useLocalState<ItemBank[]>(BANK_KEY, []);

  const hasil = useMemo(() => cariGlobal(q, { konten, produk, bank }, 8), [q, konten, produk, bank]);
  const dikelompokkan = useMemo(
    () =>
      URUTAN_JENIS.map((jenis) => ({
        jenis,
        baris: hasil.filter((h) => h.jenis === jenis),
      })).filter((g) => g.baris.length > 0),
    [hasil],
  );

  const totalSumber = konten.length + produk.length + bank.length;

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari judul konten, nama produk, tag, atau masalah audiens…"
        aria-label="Kata kunci pencarian global"
        autoFocus
        className={cn(inputClass, "h-11")}
      />
      <p className="text-meta text-muted-foreground">
        {totalSumber === 0
          ? "Belum ada data tersimpan di browser ini."
          : `${konten.length} konten · ${produk.length} produk · ${bank.length} masalah di indeks lokal`}
      </p>

      {q.trim() !== "" && hasil.length === 0 ? (
        <Card>
          <p className="text-badan text-muted-foreground">
            Tidak ada hasil untuk “{q.trim()}”. Coba kata lain, atau tambahkan data lewat Buat
            posting dan Riset audiens.
          </p>
        </Card>
      ) : null}

      {dikelompokkan.map((grup) => (
        <Card key={grup.jenis}>
          <h2 className="text-isi font-semibold">
            {LABEL_JENIS_CARI[grup.jenis]} ({grup.baris.length})
          </h2>
          <ul className="mt-3 divide-y divide-surface-border">
            {grup.baris.map((h: HasilCari) => (
              <li key={`${h.jenis}-${h.id}`} className="py-2">
                <Link
                  href={h.href}
                  className="block text-badan font-medium underline-offset-2 hover:underline"
                >
                  {h.judul}
                </Link>
                <p className="mt-0.5 text-meta text-muted-foreground">{h.keterangan}</p>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
