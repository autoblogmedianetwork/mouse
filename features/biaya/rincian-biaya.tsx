"use client";

/**
 * Halaman rincian biaya AI (Fase 5). Sumbernya sama dengan widget header:
 * `/api/biaya` yang mengagregasi tabel `generations` milik user. Halaman ini
 * menampah rincian per provider dan per fungsi, plus peringatan bila provider
 * database gagal dan panggilan jatuh ke env.
 */
import Link from "next/link";
import { useEffect, useState } from "react";

import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import type { RingkasanFungsi, RingkasanProvider, StatistikBiaya } from "@/lib/ai/statistik";

function usd(nilai: number | null): string {
  if (nilai === null) return "—";
  return `$${nilai.toFixed(4)}`;
}

function angka(nilai: number): string {
  return nilai.toLocaleString("id-ID");
}

function labelProvider(nama: string): string {
  if (nama === "env-fallback") return "env (fallback)";
  if (nama === "tidak tercatat") return "lama (sebelum migrasi)";
  return nama;
}

const sel = "border border-surface-border px-3 py-2 text-left align-top";

export function RincianBiaya() {
  const [data, setData] = useState<StatistikBiaya | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    let hidup = true;
    fetch("/api/biaya", { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json().catch(() => null)) as
          | (Partial<StatistikBiaya> & { ok?: boolean; error?: string })
          | null;
        if (!hidup) return;
        if (!res.ok || !json?.ok) {
          setGalat(json?.error ?? `Server menjawab HTTP ${res.status}.`);
          return;
        }
        setData({
          hariIniUsd: json.hariIniUsd ?? null,
          bulanIniUsd: json.bulanIniUsd ?? null,
          adaCatatan: Boolean(json.adaCatatan),
          batasUsd: typeof json.batasUsd === "number" ? json.batasUsd : 0,
          persenBulan: typeof json.persenBulan === "number" ? json.persenBulan : 0,
          perFungsi: json.perFungsi ?? {},
          perProvider: json.perProvider ?? {},
          fallbackPanggilan: typeof json.fallbackPanggilan === "number" ? json.fallbackPanggilan : 0,
          fallbackTerakhir: json.fallbackTerakhir ?? null,
          totalTokens: typeof json.totalTokens === "number" ? json.totalTokens : 0,
        });
      })
      .catch(() => {
        if (hidup) setGalat("Tidak bisa menghubungi server. Periksa koneksi lalu muat ulang.");
      })
      .finally(() => {
        if (hidup) setMemuat(false);
      });
    return () => {
      hidup = false;
    };
  }, []);

  if (memuat) {
    return <p className="text-badan text-muted-foreground">Memuat rincian biaya…</p>;
  }

  if (galat || !data) {
    return (
      <p className="border border-status-failed bg-status-failed/10 px-3 py-2 text-badan text-status-failed">
        {galat ?? "Rincian biaya tidak tersedia."}
      </p>
    );
  }

  const provider = Object.entries(data.perProvider).sort(
    ([, a], [, b]) => (b.usd ?? -1) - (a.usd ?? -1) || b.panggilan - a.panggilan,
  );
  const fungsi = Object.entries(data.perFungsi).sort(([, a], [, b]) => b.panggilan - a.panggilan);
  const sisa = Math.max(0, data.batasUsd - (data.bulanIniUsd ?? 0));
  const persen = Math.min(100, Math.max(0, data.persenBulan));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biaya AI"
        description="Pemakaian bulan ini per provider dan per fungsi, dari log generations milik akun ini."
      />

      {data.fallbackTerakhir ? (
        <div
          role="status"
          className="border border-warning/50 bg-warning/10 px-4 py-3 text-badan text-warning-foreground"
        >
          <p className="font-medium">Provider database gagal, panggilan dialihkan ke env.</p>
          <p className="mt-1 text-meta">
            {data.fallbackPanggilan} panggilan bulan ini memakai env cadangan. Terakhir:{" "}
            {new Date(data.fallbackTerakhir).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            . Periksa koneksi provider di{" "}
            <Link href="/pengaturan" className="underline underline-offset-2">
              Pengaturan → AI
            </Link>
            .
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Hari ini", nilai: usd(data.hariIniUsd) },
          { label: "Bulan ini", nilai: usd(data.bulanIniUsd) },
          { label: "Batas bulanan", nilai: usd(data.batasUsd) },
          { label: "Sisa anggaran", nilai: usd(sisa) },
        ].map((item) => (
          <Card key={item.label} padat className="px-4 py-3">
            <p className="font-mono text-meta uppercase tracking-meta text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-isi font-semibold tabular-nums">{item.nilai}</p>
          </Card>
        ))}
      </div>

      <Card padat className="px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-badan font-medium">Pemakaian anggaran</p>
          <p className="text-meta tabular-nums text-muted-foreground">
            {persen.toFixed(0)}% · {angka(data.totalTokens)} token
          </p>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(persen)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progres biaya AI terhadap batas bulanan"
        >
          <div
            className={`h-full rounded-full ${
              persen >= 100 ? "bg-status-failed" : persen >= 80 ? "bg-primary" : "bg-status-ready"
            }`}
            style={{ width: `${Math.max(persen, 1)}%` }}
          />
        </div>
        <p className="mt-1 text-meta text-muted-foreground">
          {data.adaCatatan
            ? "Angka diambil dari log generations; biaya yang belum tercatat bisa berbeda sedikit."
            : "Belum ada panggilan AI yang tercatat bulan ini."}
        </p>
      </Card>

      <section className="space-y-2">
        <h2 className="text-isi font-semibold">Per provider</h2>
        {provider.length === 0 ? (
          <p className="text-badan text-muted-foreground">Belum ada panggilan AI bulan ini.</p>
        ) : (
          <div className="overflow-x-auto border border-surface-border">
            <table className="w-full border-collapse text-badan">
              <thead>
                <tr className="bg-surface">
                  <th className={sel}>Provider</th>
                  <th className={sel}>Panggilan</th>
                  <th className={sel}>Token masuk</th>
                  <th className={sel}>Token keluar</th>
                  <th className={sel}>Biaya</th>
                  <th className={sel}>Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                {provider.map(([nama, r]) => {
                  const baris: RingkasanProvider = r;
                  return (
                    <tr key={nama} className="border-t border-surface-border">
                      <td className={sel}>
                        {labelProvider(nama)}
                        {nama === "env-fallback" ? (
                          <span className="ml-2 border border-warning/50 px-1.5 py-0.5 font-mono text-mikro uppercase tracking-badge text-warning-foreground">
                            fallback
                          </span>
                        ) : null}
                      </td>
                      <td className={`${sel} tabular-nums`}>{angka(baris.panggilan)}</td>
                      <td className={`${sel} tabular-nums`}>{angka(baris.inputTokens)}</td>
                      <td className={`${sel} tabular-nums`}>{angka(baris.outputTokens)}</td>
                      <td className={`${sel} tabular-nums`}>{usd(baris.usd)}</td>
                      <td className={`${sel} tabular-nums`}>{usd(baris.rataRata)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-isi font-semibold">Per fungsi</h2>
        {fungsi.length === 0 ? (
          <p className="text-badan text-muted-foreground">Belum ada panggilan AI bulan ini.</p>
        ) : (
          <div className="overflow-x-auto border border-surface-border">
            <table className="w-full border-collapse text-badan">
              <thead>
                <tr className="bg-surface">
                  <th className={sel}>Fungsi</th>
                  <th className={sel}>Panggilan</th>
                  <th className={sel}>Token masuk</th>
                  <th className={sel}>Token keluar</th>
                  <th className={sel}>Biaya</th>
                  <th className={sel}>Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                {fungsi.map(([nama, r]) => {
                  const baris: RingkasanFungsi = r;
                  return (
                    <tr key={nama} className="border-t border-surface-border">
                      <td className={sel}>{nama}</td>
                      <td className={`${sel} tabular-nums`}>{angka(baris.panggilan)}</td>
                      <td className={`${sel} tabular-nums`}>{angka(baris.inputTokens)}</td>
                      <td className={`${sel} tabular-nums`}>{angka(baris.outputTokens)}</td>
                      <td className={`${sel} tabular-nums`}>{usd(baris.usd)}</td>
                      <td className={`${sel} tabular-nums`}>{usd(baris.rataRata)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
