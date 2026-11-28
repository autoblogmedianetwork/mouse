"use client";

/**
 * Siap Copas — satu layar pagi: konten hari ini + tombol salin teks dan
 * salin balasan afiliasi. Publikasi tetap manual (Fase 4: nol risiko ban),
 * tapi persiapannya tidak perlu buka-buka menu lagi.
 */
import Link from "next/link";
import { TagShopee } from "./tag-shopee";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import { LanjutLangkah } from "@/components/lanjut-langkah";
import { PageHeader } from "@/components/page-header";
import { muatKonten, simpanKonten, tandaiTerkirim } from "@/lib/konten/store";
import type { Konten } from "@/lib/konten/skema";
import { bangunIntentThreads } from "@/lib/platforms/intent-threads";
import { CTA_BAWAAN, gabungCta } from "@/lib/konten/cta";
import {
  jamJadwal,
  kunciTanggalLokal,
  kontenSiapCopas,
  ringkasanSiapCopas,
  teksSiapCopas,
  type KontenSiapCopas as K,
} from "@/lib/konten/siap-copas";

const tombol =
  "inline-flex h-11 sm:h-9 items-center border border-surface-border px-3 text-meta font-medium hover:bg-muted";
const tombolUtama =
  "inline-flex h-11 sm:h-9 items-center bg-primary px-3 text-meta font-medium text-primary-foreground hover:opacity-90";

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
  const [ctaId, setCtaId] = useState<string>(CTA_BAWAAN[0].id);

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
        <select
          aria-label="Pilih CTA penutup"
          value={ctaId}
          onChange={(e) => setCtaId(e.target.value)}
          className="h-11 sm:h-9 border border-surface-border bg-surface px-2 text-meta"
        >
          {CTA_BAWAAN.map((c) => (
            <option key={c.id} value={c.id}>
              CTA: {c.label}
            </option>
          ))}
        </select>
        {(() => {
          const cta = CTA_BAWAAN.find((c) => c.id === ctaId);
          if (!cta) return null;
          const gabung = gabungCta(utama, cta.teks);
          return (
            <button
              type="button"
              className={tombol}
              disabled={!gabung.ok}
              title={gabung.ok ? undefined : gabung.galat}
              onClick={() => {
                if (gabung.ok) void salin(gabung.teks, "Teks + CTA");
                else setPesan(gabung.galat);
              }}
            >
              Salin + CTA
            </button>
          );
        })()}
        {(() => {
          const intent = bangunIntentThreads(utama);
          return intent.ok ? (
            <a
              href={intent.url}
              target="_blank"
              rel="noopener noreferrer"
              className={tombol}
              title="Buka komposer Threads dengan teks ini sudah terisi — kamu tetap yang menekan kirim"
            >
              Buka di Threads ↗
            </a>
          ) : null;
        })()}
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

      {k.link_produk && k.letak_link !== "tanpa_link" ? (
        <TagShopee kontenId={k.id} namaProduk={k.produk_nama ?? ""} link={k.link_produk} />
      ) : null}
      {pesan ? (
        <p className="text-meta text-status-ready" role="status">
          {pesan}
        </p>
      ) : null}
      {pesan === "Ditandai terkirim." ? <LanjutLangkah dari={4} /> : null}
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
        title="Siap Salin"
        description="Konten hari ini yang tinggal disalin ke platform. Publikasi tetap manual — aman dari risiko ban."
      />

      <Card>
        <p className="text-badan font-medium">{ringkasanSiapCopas(terjadwal, cadangan)}</p>
        <p className="mt-1 text-meta text-muted-foreground">
          Tanggal {hariIni}. Tempel dari clipboard dengan Ctrl+V di aplikasi platform.
        </p>
      </Card>

      {terjadwal.length > 0 || cadangan.length > 0 ? (
        <p className="border border-surface-border bg-muted/40 px-3 py-2 text-meta text-muted-foreground">
          Wajib transparan: postingan dengan link affiliate harus ditandai — pakai label
          paid partnership bila aplikasimu menampilkannya, atau tulis #iklan di teks
          (aturan konten berbayar Meta). Utamakan balasan untuk link, sesuai strategi.
        </p>
      ) : null}

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
