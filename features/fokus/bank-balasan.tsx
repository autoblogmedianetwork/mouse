"use client";

/**
 * BankBalasan — template balasan suara Pak Slem, salin satu klik
 * (riset 17 Nov: balasan = >50% views di Threads; tuas pertumbuhan
 * terbesar untuk pemula). Manual murni: disalin, disesuaikan dengan
 * konteks postingan, lalu ditempel sendiri.
 *
 * Pengembangan: (1) balasan pribadi milik user (localStorage), (2) varian
 * AI per situasi dengan suara user dari Analisa Gaya (persona bernama).
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/card";
import { BANK_BALASAN } from "@/lib/konten/bank-balasan";
import {
  hapusBalasanPribadi,
  muatBalasanPribadi,
  simpanBalasanPribadi,
  tambahBalasanPribadi,
  type BalasanPribadi,
} from "@/lib/konten/bank-balasan-pribadi";
import { panggilAI } from "@/features/lab/lab-bersama";
import type { VarianBalasan } from "@/lib/ai/schemas";

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

/** Ambil gaya bicara persona bernama (hasil Analisa Gaya) bila ada. */
function ambilGayaPersona(): string | undefined {
  try {
    const raw = window.localStorage.getItem("autothreads-persona-bernama");
    if (!raw) return undefined;
    const p = JSON.parse(raw) as { gaya?: string };
    return p?.gaya?.trim() || undefined;
  } catch {
    return undefined;
  }
}

function BagianVarian({ situasi, templat }: { situasi: string; templat: string }) {
  const [varian, setVarian] = useState<VarianBalasan | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");

  const jalankan = async () => {
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<VarianBalasan>("/api/ai/varian-balasan", {
      situasi,
      templat,
      gayaBicara: ambilGayaPersona(),
    });
    setMemuat(false);
    if (!res.ok || !res.data) {
      setVarian(null);
      setGalat(res.error ?? "Gagal membuat varian.");
      return;
    }
    setVarian(res.data);
  };

  return (
    <div className="mt-2">
      <button type="button" className={tombol} onClick={() => void jalankan()} disabled={memuat}>
        {memuat ? "Menulis varian…" : "Buat varian AI"}
      </button>
      {galat ? (
        <p className="mt-2 text-meta text-status-failed" role="alert">
          {galat}
        </p>
      ) : null}
      {varian ? (
        <div className="mt-2 space-y-2">
          {varian.varian.map((v, i) => (
            <BarisTemplate key={i} teks={v} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BagianPribadi() {
  const [daftar, setDaftar] = useState<BalasanPribadi[]>([]);
  const [judul, setJudul] = useState("");
  const [teks, setTeks] = useState("");
  const [galat, setGalat] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- muat localStorage setelah mount agar markup server dan klien sama
    setDaftar(muatBalasanPribadi());
  }, []);

  const tambah = () => {
    const hasil = tambahBalasanPribadi(daftar, judul, teks);
    if (!hasil.ok) {
      setGalat(hasil.galat);
      return;
    }
    setGalat("");
    setDaftar(hasil.data);
    simpanBalasanPribadi(hasil.data);
    setJudul("");
    setTeks("");
  };

  const hapus = (id: string) => {
    const sisa = hapusBalasanPribadi(daftar, id);
    setDaftar(sisa);
    simpanBalasanPribadi(sisa);
  };

  return (
    <section>
      <h3 className="text-badan font-semibold">Balasan milikku</h3>
      <p className="text-meta text-muted-foreground">
        Simpan balasan andalanmu sendiri — tersimpan di perangkat ini.
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Judul (mis. Bales tanya harga)"
          aria-label="Judul balasan pribadi"
          className="w-full border border-surface-border bg-surface px-3 py-1.5 text-badan outline-none focus:border-primary sm:max-w-[16rem]"
        />
        <input
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          placeholder="Teks balasan…"
          aria-label="Teks balasan pribadi"
          className="w-full border border-surface-border bg-surface px-3 py-1.5 text-badan outline-none focus:border-primary"
        />
        <button type="button" className={tombol} onClick={tambah}>
          Simpan
        </button>
      </div>
      {galat ? (
        <p className="mt-2 text-meta text-status-failed" role="alert">
          {galat}
        </p>
      ) : null}
      {daftar.length > 0 ? (
        <div className="mt-2 space-y-2">
          {daftar.map((b) => (
            <div key={b.id} className="flex items-start justify-between gap-2 border border-surface-border bg-surface p-2">
              <div className="min-w-0">
                <p className="text-meta font-semibold">{b.judul}</p>
                <p className="min-w-0 text-badan">{b.teks}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <BarisTombolSalin teks={b.teks} judul={b.judul} />
                <button type="button" className={tombol} onClick={() => hapus(b.id)} aria-label={`Hapus ${b.judul}`}>
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function BarisTombolSalin({ teks, judul }: { teks: string; judul: string }) {
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
    <button type="button" className={tombol} onClick={salin} aria-label={`Salin ${judul}`}>
      {pesan ? "✓" : "Salin"}
    </button>
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
          <BagianPribadi />
          {BANK_BALASAN.map((s) => (
            <section key={s.id}>
              <h3 className="text-badan font-semibold">{s.situasi}</h3>
              <p className="text-meta text-muted-foreground">{s.kapan}</p>
              <div className="mt-2 space-y-2">
                {s.templat.map((t, i) => (
                  <BarisTemplate key={i} teks={t} />
                ))}
              </div>
              <BagianVarian situasi={s.situasi} templat={s.templat[0]} />
            </section>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
