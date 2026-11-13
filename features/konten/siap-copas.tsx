"use client";

/**
 * Siap Copas — satu layar pagi: konten hari ini + tombol salin teks dan
 * salin balasan afiliasi. Publikasi tetap manual (Fase 4: nol risiko ban),
 * tapi persiapannya tidak perlu buka-buka menu lagi.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { muatKonten, simpanKonten, tandaiTerkirim } from "@/lib/konten/store";
import type { Konten } from "@/lib/konten/skema";
import {
  jamJadwal,
  kunciTanggalLokal,
  kontenSiapCopas,
  ringkasanSiapCopas,
  teksSiapCopas,
  type KontenSiapCopas as K,
} from "@/lib/konten/siap-copas";

const tombol =
  "inline-flex h-9 items-center border border-surface-border px-3 text-meta font-medium hover:bg-muted";
const tombolUtama =
  "inline-flex h-9 items-center bg-primary px-3 text-meta font-medium text-primary-foreground hover:opacity-90";

function Kartu({
  k,
  cadangan,
  onTandai,
}: {
  k: K;
  cadangan?: boolean;
  onTandai?: () => void;
}) {
  const { utama, balasan } = teksSiapCopas(k);
  const [pesan, setPesan] = useState<string | null>(null);

  const salin = async (teks: string, label: string) => {
    try {
      await navigator.clipboard.writeText(teks);
      setPesan(`${label} disalin. Tinggal tempel di platform.`);
    } catch {
      setPesan("Browser menolak menyalin otomatis. Pilih teksnya lalu salin manual.");
    }
  };

  const tandai = () => {
    onTandai?.();
    setPesan("Ditandai terkirim.");
  };

  return (
    <div className="space-y-2 border border-surface-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-badan font-medium">
          {jamJadwal(k.jadwal_at) ? (
            <span className="mr-2 font-mono text-meta text-muted-foreground">
              {jamJadwal(k.jadwal_at)}
            </span>
          ) : null}
          {k.judul}
        </p>
        <p className="text-meta text-muted-foreground">
          {cadangan ? "Cadangan (belum dijadwalkan)" : "Terjadwal hari ini"}
          {k.produk_nama ? ` · ${k.produk_nama}` : ""}
        </p>
      </div>

      <pre className="max-h-56 overflow-auto whitespace-pre-wrap border border-surface-border bg-muted/40 p-2 text-badan">
        {utama}
      </pre>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={tombolUtama} onClick={() => salin(utama, "Teks")}>
          Salin teks
        </button>
        {balasan ? (
          <button type="button" className={tombol} onClick={() => salin(balasan, "Balasan afiliasi")}>
            Salin balasan (link)
          </button>
        ) : null}
        {!cadangan ? (
          <button type="button" className={tombol} onClick={tandai}>
            ✓ Sudah ditempel
          </button>
        ) : (
          <Link href="/antrian" className={tombol}>
            Jadwalkan dulu →
          </Link>
        )}
      </div>

      {balasan ? (
        <p className="text-meta text-muted-foreground">
          Link sengaja dipisah ke balasan — sesuai strategi minggu pertama (link tidak di
          postingan utama).
        </p>
      ) : null}
      {pesan ? (
        <p className="text-meta text-status-ready" role="status">
          {pesan}
        </p>
      ) : null}
    </div>
  );
}

export function SiapCopas() {
  const [daftar, setDaftar] = useState<Konten[]>([]);
  const hariIni = kunciTanggalLokal(new Date());

  // Hidrasi localStorage setelah mount agar sama dengan SSR.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi localStorage harus setelah mount agar sama dengan SSR
    setDaftar(muatKonten());
  }, []);

  const tandai = (id: string) => {
    const berikut = tandaiTerkirim(daftar, id);
    simpanKonten(berikut);
    setDaftar(berikut);
  };
  const { terjadwal, cadangan } = useMemo(
    () => kontenSiapCopas(daftar as unknown as K[], hariIni),
    [daftar, hariIni],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Siap Copas"
        description="Konten hari ini yang tinggal disalin ke platform. Publikasi tetap manual — aman dari risiko ban."
      />

      <Card>
        <p className="text-badan font-medium">{ringkasanSiapCopas(terjadwal, cadangan)}</p>
        <p className="mt-1 text-meta text-muted-foreground">
          Tanggal {hariIni}. Tempel dari clipboard dengan Ctrl+V di aplikasi platform.
        </p>
      </Card>

      {terjadwal.length === 0 && cadangan.length === 0 ? (
        <Card className="space-y-3">
          <p className="text-badan text-muted-foreground">
            Belum ada konten untuk hari ini. Isi dulu dari antrian atau buat konten baru.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/antrian" className={tombolUtama}>
              Buka Antrian
            </Link>
            <Link href="/posting/baru" className={tombol}>
              Buat posting baru
            </Link>
            <Link href="/kalender" className={tombol}>
              Isi otomatis kalender
            </Link>
          </div>
        </Card>
      ) : null}

      {terjadwal.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-isi font-semibold">Terjadwal hari ini</h2>
          {terjadwal.map((k) => (
            <Kartu key={k.id} k={k} onTandai={() => tandai(k.id)} />
          ))}
        </section>
      ) : null}

      {cadangan.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-isi font-semibold">Cadangan tanpa jadwal</h2>
          <p className="text-meta text-muted-foreground">
            Konten siap posting yang belum punya tanggal — pakai kalau slot hari ini kosong.
          </p>
          {cadangan.map((k) => (
            <Kartu key={k.id} k={k} cadangan />
          ))}
        </section>
      ) : null}
    </div>
  );
}
