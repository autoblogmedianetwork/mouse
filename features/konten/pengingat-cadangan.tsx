"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/card";
import {
  KEY_CADANGAN_TERAKHIR,
  perluCadangan,
  usiaCadanganHari,
} from "@/lib/konten/cadangan";
import { eksporJSON } from "@/lib/konten/ekspor";
import { muatKonten } from "@/lib/konten/store";

/**
 * Pengingat cadangan mingguan (tanpa server). Panel hanya muncul bila cadangan
 * terakhir sudah lewat 7 hari, lalu mengunduh JSON yang sama dengan tombol
 * "Ekspor JSON" di Antrian.
 */
export function PengingatCadangan() {
  const [perlu, setPerlu] = useState(false);
  const [usia, setUsia] = useState<number | null>(null);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    let terakhir: string | null = null;
    try {
      terakhir = window.localStorage.getItem(KEY_CADANGAN_TERAKHIR);
    } catch {
      terakhir = null;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- baca localStorage setelah mount
    setPerlu(perluCadangan(terakhir));
    setUsia(usiaCadanganHari(terakhir));
  }, []);

  if (!perlu) return null;

  const unduh = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([eksporJSON(muatKonten())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autothreads-cadangan-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    try {
      window.localStorage.setItem(KEY_CADANGAN_TERAKHIR, new Date().toISOString());
    } catch {
      // penyimpanan penuh/diblokir: pengingat akan muncul lagi besok
    }
    setPerlu(false);
    setPesan("Cadangan diunduh. Pengingat berikutnya 7 hari lagi.");
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-isi font-semibold">Waktunya cadangkan data</h2>
          <p className="mt-1 text-badan text-muted-foreground">
            {pesan ||
              (usia === null
                ? "Belum pernah mencadangkan. Data hanya ada di browser ini."
                : `Cadangan terakhir ${usia} hari lalu. Data hanya ada di browser ini.`)}
          </p>
        </div>
        <button
          type="button"
          onClick={unduh}
          className="inline-flex h-9 items-center bg-primary px-4 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Unduh cadangan
        </button>
      </div>
    </Card>
  );
}
