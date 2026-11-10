"use client";

import { useState, useSyncExternalStore } from "react";
import { bersihkanDataContoh, hitungDataContoh } from "@/lib/konten/pembersih-dummy";

function subscribeTanpaPerubahan() {
  return () => {};
}

/** Dibaca setelah hidrasi supaya markup server dan klien sama. */
function jumlahContoh(): number {
  if (typeof window === "undefined") return 0;
  try {
    return hitungDataContoh(window.localStorage).total;
  } catch {
    return 0;
  }
}

/**
 * Pembersih sampel dummy 1-klik (AGENTS rule 4). Hanya entri bertanda
 * "Contoh:"/"SAMPEL DUMMY" yang dihapus; konten sungguhan tidak disentuh.
 */
export function PembersihDataContoh() {
  const total = useSyncExternalStore(subscribeTanpaPerubahan, jumlahContoh, () => 0);
  const [minta, setMinta] = useState(false);
  const [pesan, setPesan] = useState("");

  const hapus = () => {
    const hasil = bersihkanDataContoh(window.localStorage);
    setMinta(false);
    setPesan(
      `Dihapus: ${hasil.kontenDihapus} konten contoh${
        hasil.draftDihapus ? " dan 1 draft contoh" : ""
      }. Memuat ulang…`,
    );
    window.setTimeout(() => window.location.reload(), 900);
  };

  return (
    <div className="mt-4 border-t border-surface-border pt-4">
      <p className="text-badan font-medium">Bersihkan data contoh</p>
      <p className="mt-1 text-meta text-muted-foreground">
        Menghapus konten dan draft bertanda “Contoh:” / “SAMPEL DUMMY”. Konten sungguhan tetap
        aman.
      </p>

      {pesan ? (
        <p className="mt-2 text-meta text-status-ready" aria-live="polite">
          {pesan}
        </p>
      ) : minta ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-meta text-muted-foreground">
            {total} data contoh akan dihapus permanen.
          </span>
          <button
            type="button"
            onClick={hapus}
            className="border border-surface-border px-3 py-1.5 text-meta font-medium text-status-failed hover:bg-muted"
          >
            Ya, hapus
          </button>
          <button
            type="button"
            onClick={() => setMinta(false)}
            className="border border-surface-border px-3 py-1.5 text-meta font-medium hover:bg-muted"
          >
            Batal
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMinta(true)}
          disabled={total === 0}
          className="mt-3 border border-surface-border px-3 py-1.5 text-meta font-medium hover:bg-muted disabled:opacity-40"
        >
          {total === 0 ? "Tidak ada data contoh" : `Hapus ${total} data contoh`}
        </button>
      )}
    </div>
  );
}
