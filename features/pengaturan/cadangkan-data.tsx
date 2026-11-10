"use client";

/**
 * Cadangkan & pulihkan data (Fase 4-B).
 *
 * Data utama aplikasi tinggal di localStorage. Tombol di sini mengunduh satu
 * file JSON berisi semuanya, atau memulihkannya dari file cadangan. Pemulihan
 * butuh konfirmasi (checkpoint eksplisit) karena menimpa data lama.
 */
import { useRef, useState } from "react";
import { Card } from "@/components/card";
import {
  kumpulkanCadangan,
  pulihkanCadangan,
  validasiBerkasCadangan,
} from "@/lib/backup/simpanan";

export function CadangkanData() {
  const [pesan, setPesan] = useState<string | null>(null);
  const [menungguKonfirmasi, setMenungguKonfirmasi] = useState(false);
  const inputBerkas = useRef<HTMLInputElement>(null);

  const unduh = () => {
    const hasil = kumpulkanCadangan();
    if (!hasil.ok || !hasil.berkas) {
      setPesan(hasil.pesan);
      return;
    }
    const blob = new Blob([JSON.stringify(hasil.berkas, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const tanggal = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `heaviliate-cadangan-${tanggal}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setPesan(hasil.pesan);
  };

  const saatPilihBerkas = async (berkas: File | null) => {
    setMenungguKonfirmasi(false);
    if (!berkas) return;
    const teks = await berkas.text();
    const sah = validasiBerkasCadangan(teks);
    if (!sah) {
      setPesan("Berkas tidak dikenali — pastikan ini file cadangan Heaviliate (.json).");
      return;
    }
    const hasil = pulihkanCadangan(sah);
    setPesan(hasil.pesan);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">Cadangkan data</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Semua data Anda (konten, draft, bank masalah, pengaturan) tersimpan di
        peramban ini. Unduh cadangannya secara berkala — kalau cache peramban
        terhapus, file ini yang menyelamatkan.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={unduh}
          className="rounded-md bg-primary px-4 py-2 text-badan font-medium text-primary-foreground hover:opacity-90"
        >
          Unduh cadangan
        </button>
        {menungguKonfirmasi ? (
          <button
            type="button"
            onClick={() => inputBerkas.current?.click()}
            className="rounded-md border border-destructive bg-destructive/10 px-4 py-2 text-badan font-medium text-destructive"
          >
            Ya, pulihkan sekarang
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMenungguKonfirmasi(true);
              inputBerkas.current?.click();
            }}
            className="rounded-md border border-surface-border px-4 py-2 text-badan font-medium hover:bg-muted"
          >
            Pulihkan dari berkas
          </button>
        )}
        <input
          ref={inputBerkas}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void saatPilihBerkas(e.target.files?.[0] ?? null)}
        />
      </div>
      {menungguKonfirmasi ? (
        <p className="mt-2 text-meta text-destructive">
          Pemulihan akan MENIMPA data dengan isi berkas cadangan. Tekan
          &quot;Ya, pulihkan sekarang&quot; setelah memilih berkas untuk lanjut.
        </p>
      ) : null}
      {pesan ? (
        <p className="mt-2 text-meta text-muted-foreground" role="status">
          {pesan}
        </p>
      ) : null}
    </Card>
  );
}
