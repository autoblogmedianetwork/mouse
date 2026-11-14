"use client";

/**
 * Panel preset gaya carousel (refactor R6). Logika & JSX dipindah utuh dari
 * carousel-slide-editor.tsx. Preset tersimpan per akun di tabel
 * carousel_gaya_preset (migrasi 0009); preset terakhir yang dipakai otomatis
 * diterapkan saat editor dibuka.
 *
 * `presetDipilih` dikendalikan induk supaya tombol "Reset gaya" di panel Gaya
 * bisa mengosongkan pilihan dari luar.
 */
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/card";
import {
  daftarPresetGaya,
  hapusPresetGaya,
  simpanPresetGaya,
  type GayaPreset,
} from "@/lib/konten/gaya-preset";
import type { GayaCarousel } from "./carousel-tipe";

export const KUNCI_PRESET_TERAKHIR = "heaviliate:preset_gaya_terakhir";

interface Props {
  gaya: GayaCarousel;
  presetDipilih: string;
  setPresetDipilih: (id: string) => void;
  /** Terapkan nilai gaya dari preset ke induk (setGaya). */
  onTerapkanGaya: (g: GayaCarousel) => void;
}

export function PanelPresetGaya({ gaya, presetDipilih, setPresetDipilih, onTerapkanGaya }: Props) {
  const [presets, setPresets] = useState<GayaPreset[]>([]);
  const [namaPresetBaru, setNamaPresetBaru] = useState("");
  const [presetMemuat, setPresetMemuat] = useState(false);
  const [pesanPreset, setPesanPreset] = useState<string | null>(null);

  const tampilkanPesanPreset = (pesan: string) => {
    setPesanPreset(pesan);
    setTimeout(() => setPesanPreset(null), 3000);
  };

  const muatDaftarPreset = useCallback(async (): Promise<GayaPreset[]> => {
    try {
      setPresetMemuat(true);
      const daftar = await daftarPresetGaya();
      setPresets(daftar);
      return daftar;
    } catch (err) {
      tampilkanPesanPreset(err instanceof Error ? err.message : "Gagal memuat preset.");
      return [];
    } finally {
      setPresetMemuat(false);
    }
  }, []);

  // Muat sekali saat editor terbuka; terapkan otomatis preset terakhir yang dipakai
  // supaya setiap carousel baru langsung punya gaya yang sama.
  useEffect(() => {
    (async () => {
      const daftar = await muatDaftarPreset();
      const idTerakhir = window.localStorage.getItem(KUNCI_PRESET_TERAKHIR);
      const pilih = daftar.find((p) => p.id === idTerakhir);
      if (pilih) {
        onTerapkanGaya(pilih.gaya);
        setPresetDipilih(pilih.id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dijalankan sekali saat editor dibuka, sama seperti kode asli
  }, [muatDaftarPreset]);

  const terapkanPreset = (p: GayaPreset) => {
    onTerapkanGaya(p.gaya);
    setPresetDipilih(p.id);
    window.localStorage.setItem(KUNCI_PRESET_TERAKHIR, p.id);
    tampilkanPesanPreset(`Preset "${p.nama}" diterapkan ke semua slide.`);
  };

  const simpanPresetSekarang = async () => {
    const namaLama = presets.find((p) => p.id === presetDipilih)?.nama ?? "";
    const nama = namaPresetBaru.trim() || namaLama;
    if (!nama) {
      tampilkanPesanPreset("Tulis nama preset dulu di kolom nama.");
      return;
    }
    try {
      setPresetMemuat(true);
      const tersimpan = await simpanPresetGaya(nama, gaya);
      setNamaPresetBaru("");
      await muatDaftarPreset();
      setPresetDipilih(tersimpan.id);
      window.localStorage.setItem(KUNCI_PRESET_TERAKHIR, tersimpan.id);
      tampilkanPesanPreset(`Preset "${tersimpan.nama}" tersimpan di akun.`);
    } catch (err) {
      tampilkanPesanPreset(err instanceof Error ? err.message : "Gagal menyimpan preset.");
    } finally {
      setPresetMemuat(false);
    }
  };

  const hapusPresetSekarang = async () => {
    const p = presets.find((x) => x.id === presetDipilih);
    if (!p) return;
    try {
      setPresetMemuat(true);
      await hapusPresetGaya(p.id);
      setPresets((daftar) => daftar.filter((x) => x.id !== p.id));
      window.localStorage.removeItem(KUNCI_PRESET_TERAKHIR);
      setPresetDipilih("");
      tampilkanPesanPreset(`Preset "${p.nama}" dihapus.`);
    } catch (err) {
      tampilkanPesanPreset(err instanceof Error ? err.message : "Gagal menghapus preset.");
    } finally {
      setPresetMemuat(false);
    }
  };

  return (
    <Card padat className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
      <span className="text-meta font-semibold uppercase tracking-meta text-muted-foreground">
        Preset gaya
      </span>
      <select
        value={presetDipilih}
        onChange={(e) => {
          const p = presets.find((x) => x.id === e.target.value);
          if (p) terapkanPreset(p);
          else setPresetDipilih("");
        }}
        className="border border-surface-border bg-background px-2 py-1.5 text-meta"
      >
        <option value="">Pilih preset…</option>
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nama}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={namaPresetBaru}
        onChange={(e) => setNamaPresetBaru(e.target.value)}
        maxLength={40}
        placeholder="Nama preset baru"
        className="w-40 border border-surface-border bg-background px-2 py-1.5 text-meta"
      />
      <button
        type="button"
        onClick={simpanPresetSekarang}
        disabled={presetMemuat}
        className="bg-primary px-3 py-1.5 text-meta font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        Simpan gaya ini
      </button>
      <button
        type="button"
        onClick={hapusPresetSekarang}
        disabled={!presetDipilih || presetMemuat}
        className="border border-surface-border px-3 py-1.5 text-meta text-muted-foreground hover:text-foreground disabled:opacity-40"
      >
        Hapus
      </button>
      {pesanPreset ? <span className="text-meta text-muted-foreground">{pesanPreset}</span> : null}
    </Card>
  );
}
