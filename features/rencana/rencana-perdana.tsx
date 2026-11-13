"use client";

/**
 * Rencana Perdana (Gelombang 4): 21 hari menuju komisi pertama, Threads.
 *
 * Teks tugas dari file user, dipakai apa adanya. Integrasi streak: kalau
 * semua tugas HARI INI tercentang, hari ini otomatis tercatat di streak
 * Fokus harian (satu kebiasaan, dua pintu). Hari terlewat tidak dikejar.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { KEY_FOKUS_SELESAI, catatHariSelesai, kunciHariLokal } from "@/lib/konten/fokus";
import { useLocalState } from "@/lib/konten/use-local-state";
import {
  KEY_RENCANA,
  LABEL_FASE,
  RENCANA_PERDANA,
  hariAktif,
  hariSelesaiSemua,
  mulaiRencana,
  progressPersen,
  rencanaTuntas,
  tandaiTugas,
  type StatusRencana,
} from "@/lib/rencana/rencana-perdana";
import { cn } from "@/lib/utils";

const btnPrimary =
  "inline-flex h-10 items-center rounded-md bg-primary px-5 text-badan font-medium text-primary-foreground hover:opacity-90";
const btnGhost =
  "inline-flex h-9 items-center border border-surface-border px-4 text-badan font-medium hover:bg-muted";

export function RencanaPerdana() {
  const [status, setStatus] = useState<StatusRencana | null>(null);
  const [siap, setSiap] = useState(false);
  const [hariBuka, setHariBuka] = useState<number | null>(null);
  const [, setHariStreak] = useLocalState<string[]>(KEY_FOKUS_SELESAI, []);

  // Hidrasi localStorage setelah mount agar sama dengan SSR.
  useEffect(() => {
    try {
      const mentah = window.localStorage.getItem(KEY_RENCANA);
      if (mentah) {
        const parsed = JSON.parse(mentah) as StatusRencana;
        if (parsed && typeof parsed.mulai === "string" && Array.isArray(parsed.selesai))
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi localStorage harus setelah mount agar sama dengan SSR
          setStatus(parsed);
      }
    } catch {
      // storage rusak: perlakukan sebagai belum mulai
    }
    setSiap(true);
  }, []);

  const simpan = (berikut: StatusRencana | null) => {
    setStatus(berikut);
    try {
      if (berikut) window.localStorage.setItem(KEY_RENCANA, JSON.stringify(berikut));
      else window.localStorage.removeItem(KEY_RENCANA);
    } catch {
      // storage penuh: state tetap di memori
    }
  };

  const hariIniKunci = kunciHariLokal(new Date());
  const hariSekarang = useMemo(
    () => (status ? hariAktif(status, hariIniKunci) : 1),
    [status, hariIniKunci],
  );
  const tuntas = useMemo(() => (status ? rencanaTuntas(status) : false), [status]);

  const centang = (idTugas: string) => {
    if (!status) return;
    const berikut = tandaiTugas(status, idTugas);
    simpan(berikut);
    // Integrasi streak: semua tugas hari ini selesai -> catat hari ini.
    const hariTugas = Number(idTugas.slice(1, idTugas.indexOf("t")));
    if (hariTugas === hariSekarang && hariSelesaiSemua(berikut, hariTugas)) {
      setHariStreak((prev) => catatHariSelesai(prev, hariIniKunci));
    }
  };

  if (!siap) return null;

  // Belum mulai: layar pembuka.
  if (!status) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Rencana Perdana"
          description="21 hari menuju komisi pertama di Threads — 1 konten dan 3 balasan per hari, sekitar 30 menit."
        />
        <Card className="space-y-4">
          <div className="space-y-3 text-badan">
            <p>
              Tiga fase: <span className="font-medium">Tanam</span> (hari 1–7, tanpa link) →{" "}
              <span className="font-medium">Tembak</span> (hari 8–14, produk masuk dengan jujur) →{" "}
              <span className="font-medium">Panen</span> (hari 15–21, evaluasi data nyata).
            </p>
            <p className="text-muted-foreground">
              Hari yang terlewat tidak perlu dikejar dengan menggandakan tugas. Tidak ada target
              penjualan yang dipaksakan — tujuannya membiasakan rutinitas dan mengetahui apa yang
              berhasil.
            </p>
          </div>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => simpan(mulaiRencana(hariIniKunci))}
          >
            Mulai hari ini
          </button>
        </Card>
      </div>
    );
  }

  // Tuntas: stasiun pertama.
  if (tuntas) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Rencana Perdana"
          description="21 hari menuju komisi pertama di Threads."
        />
        <Card className="space-y-4 text-center">
          <p className="text-judul font-semibold">🚂 Stasiun pertama tercapai</p>
          <p className="text-badan text-muted-foreground">
            21 hari selesai. Apa yang diulang dan apa yang dihentikan sudah Anda tahu —
            sekarang hitung langkah berikutnya dengan angka nyata di Kalkulator Cuan.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/" className={btnPrimary}>
              Buka Kalkulator Cuan
            </Link>
            <button
              type="button"
              className={btnGhost}
              onClick={() => simpan(mulaiRencana(hariIniKunci))}
            >
              Ulangi rencana untuk produk berikutnya
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const hariData = RENCANA_PERDANA.find((h) => h.hari === (hariBuka ?? hariSekarang))!;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rencana Perdana"
        description={`Hari ${hariSekarang} dari 21 · ${progressPersen(status)}% tugas selesai`}
      />

      {/* Pilih hari */}
      <Card>
        <div className="flex flex-wrap gap-1.5">
          {RENCANA_PERDANA.map((h) => {
            const selesai = hariSelesaiSemua(status, h.hari);
            const aktif = h.hari === (hariBuka ?? hariSekarang);
            return (
              <button
                key={h.hari}
                type="button"
                onClick={() => setHariBuka(h.hari)}
                className={cn(
                  "h-8 w-8 border font-mono text-meta",
                  selesai
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-surface-border text-muted-foreground hover:bg-muted",
                  aktif && "ring-2 ring-primary ring-offset-1",
                )}
                title={`Hari ${h.hari} — ${LABEL_FASE[h.fase]}`}
              >
                {h.hari}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Kartu hari terpilih */}
      <Card className="space-y-3">
        <div>
          <p className="text-meta font-mono uppercase tracking-meta text-muted-foreground">
            Hari {hariData.hari} · {LABEL_FASE[hariData.fase]}
            {hariData.hari === hariSekarang ? " · HARI INI" : ""}
          </p>
          <ul className="mt-3 space-y-2">
            {hariData.tugas.map((t) => {
              const selesai = status.selesai.includes(t.id);
              return (
                <li
                  key={t.id}
                  className={cn(
                    "flex items-start gap-3 border border-surface-border p-3 text-badan",
                    selesai && "opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selesai}
                    onChange={() => centang(t.id)}
                    className="mt-1 h-4 w-4"
                    aria-label={t.teks}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn(selesai && "line-through")}>{t.teks}</p>
                    {t.fitur ? (
                      <Link
                        href={t.fitur.href}
                        className="mt-1 inline-block text-meta font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {t.fitur.label} →
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        {hariSelesaiSemua(status, hariData.hari) ? (
          <p className="text-meta text-status-ready" role="status">
            ✓ Hari {hariData.hari} selesai — streak Fokus harian ikut tercatat.
          </p>
        ) : null}
      </Card>

      <p className="text-meta text-muted-foreground">
        Hari yang terlewat tidak perlu dikejar dengan menggandakan tugas.
      </p>
    </div>
  );
}
