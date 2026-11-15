/**
 * Bagian 3b + 4: bank masalah (Fase 3-D) dan riwayat riset.
 * Dipecah dari panel-riset.tsx (R6c) — kata kunci pencarian bank kini lokal.
 */
import { useState } from "react";
import { Card } from "@/components/card";
import { cariBank, type ItemBank } from "@/lib/riset/bank-masalah";
import type { Riset } from "@/lib/riset/skema";
import { btnGhost, inputClass } from "./riset-bersama";

interface PropsBank {
  bank: ItemBank[];
}

export function BagianBankMasalah({ bank }: PropsBank) {
  const [kataKunciBank, setKataKunciBank] = useState("");
  const hasilCari = cariBank(bank, kataKunciBank);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-isi font-semibold">Bank masalah ({bank.length})</h2>
        <input
          type="search"
          value={kataKunciBank}
          onChange={(e) => setKataKunciBank(e.target.value)}
          placeholder="Cari masalah atau kategori…"
          className={`${inputClass} max-w-xs`}
        />
      </div>
      <p className="mt-1 text-badan text-muted-foreground">
        Kumpulan masalah dari semua riset dan review pasar yang pernah Anda simpan —
        aset riset milik Anda sendiri.
      </p>
      {hasilCari.length === 0 ? (
        <p className="mt-3 text-badan text-muted-foreground">
          {bank.length === 0
            ? "Masih kosong. Tekan “Simpan masalah ke bank” di hasil riset, atau analisis review pasar."
            : "Tidak ada yang cocok dengan pencarian."}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {hasilCari.map((item, i) => (
            <li
              key={`${item.teks}-${i}`}
              className="flex flex-wrap items-center gap-2 border border-surface-border p-2"
            >
              <span className="text-badan">{item.teks}</span>
              <span className="ml-auto text-meta text-muted-foreground">
                {item.kategori} · {item.sumber}
                {item.ditambahkan ? ` · ${item.ditambahkan}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

interface PropsRiwayat {
  riwayat: Riset[];
  risetAktif: Riset | null;
  bukaRiset: (r: Riset) => void;
}

export function BagianRiwayatRiset({ riwayat, risetAktif, bukaRiset }: PropsRiwayat) {
  return (
    <section className="space-y-3">
      <h2 className="text-isi font-semibold">Riwayat riset</h2>
      {riwayat.length === 0 ? (
        <p className="text-badan text-muted-foreground">
          Belum ada riset tersimpan. Riset pertama akan muncul di sini setelah dijalankan.
        </p>
      ) : (
        <Card padat>
          <ul className="divide-y divide-surface-border">
            {riwayat.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-badan"
              >
                <span className="min-w-0">
                  <span className="font-medium">{r.niche}</span>
                  <span className="text-muted-foreground"> · {r.audiens}</span>
                  <span className="ml-2 text-meta text-muted-foreground">
                    {r.masalah.length} masalah ·{" "}
                    {new Date(r.created_at).toLocaleDateString("id-ID")}
                  </span>
                </span>
                <button type="button" className={btnGhost} onClick={() => bukaRiset(r)}>
                  {risetAktif?.id === r.id ? "Dibuka" : "Buka"}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
