"use client";

/**
 * BankBalasan — template balasan suara Pak Slem, salin satu klik
 * (riset 17 Nov: balasan = >50% views di Threads; tuas pertumbuhan
 * terbesar untuk pemula). Manual murni: disalin, disesuaikan dengan
 * konteks postingan, lalu ditempel sendiri.
 */
import { useState } from "react";
import { Card } from "@/components/card";
import { BANK_BALASAN } from "@/lib/konten/bank-balasan";

const tombol =
  "inline-flex h-9 items-center shrink-0 border border-surface-border px-3 text-meta font-medium hover:bg-muted";

function BarisTemplate({ teks }: { teks: string }) {
  const [pesan, setPesan] = useState(false);
  const salin = async () => {
    try {
      await navigator.clipboard.writeText(teks);
      setPesan(true);
      setTimeout(() => setPesan(false), 2000);
    } catch {
      setPesan(false);
    }
  };
  return (
    <div className="flex items-start justify-between gap-2 border border-surface-border bg-surface p-2">
      <p className="min-w-0 text-badan">{teks}</p>
      <button type="button" className={tombol} onClick={salin} aria-label={`Salin template: ${teks.slice(0, 30)}`}>
        {pesan ? "✓" : "Salin"}
      </button>
    </div>
  );
}

export function BankBalasan() {
  const [terbuka, setTerbuka] = useState(false);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-isi font-semibold">Bank balasan (suara Pak Slem)</h2>
          <p className="mt-1 text-badan text-muted-foreground">
            Balasan menyumbang lebih dari separuh tampilan di Threads. Ganti bagian
            [kurung] dengan konteks postingan yang kamu balas — jangan ditempel mentah.
          </p>
        </div>
        <button
          type="button"
          className={tombol}
          aria-expanded={terbuka}
          onClick={() => setTerbuka((t) => !t)}
        >
          {terbuka ? "Tutup" : "Buka semua"}
        </button>
      </div>

      {terbuka ? (
        <div className="mt-4 space-y-4">
          {BANK_BALASAN.map((s) => (
            <section key={s.id}>
              <h3 className="text-badan font-semibold">{s.situasi}</h3>
              <p className="text-meta text-muted-foreground">{s.kapan}</p>
              <div className="mt-2 space-y-2">
                {s.templat.map((t, i) => (
                  <BarisTemplate key={i} teks={t} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
