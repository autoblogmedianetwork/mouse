"use client";

/**
 * Panel riset audiens + peluang produk (tahap 1-2 Content Machine).
 *
 * Alur: niche + audiens → `POST /api/audience` (10 masalah, tersimpan) →
 * `POST /api/audience/peluang` (20 kategori, tersimpan). Keduanya dipisah
 * supaya riset tidak hilang saat tahap 2 gagal, dan supaya peluang bisa
 * disusun ulang tanpa membayar ulang riset.
 *
 * Semua keluaran AI berstatus draft: kategori baru menjadi produk setelah
 * user menekan "Buat produk", dan harga/tautan tetap diisi user.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { csvPeluang, csvRiset, NAMA_BERKAS } from "@/lib/riset/ekspor";
import {
  AUDIENS_CONTOH,
  NICHE_AWAL,
  barisKePeluang,
  urutkanPeluang,
  type Peluang,
  type Riset,
} from "@/lib/riset/skema";
import { daftarPeluang, daftarRiset, jadikanProduk } from "@/lib/riset/store";
import { PESAN_ENV_KURANG, supabaseSiap } from "@/lib/supabase/klien";

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const btnUtama =
  "inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";
const btnGhost =
  "rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60";

const labelPrioritas: Record<Peluang["prioritas"], string> = {
  tinggi: "bg-primary text-primary-foreground",
  sedang: "bg-muted text-foreground",
  rendah: "bg-transparent text-muted-foreground",
};

function unduhCsv(nama: string, isi: string) {
  const url = URL.createObjectURL(new Blob([isi], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}

export function PanelRiset() {
  const siap = supabaseSiap();
  const [niche, setNiche] = useState(NICHE_AWAL);
  const [audiens, setAudiens] = useState("");
  const [riset, setRiset] = useState<Riset | null>(null);
  const [peluang, setPeluang] = useState<Peluang[]>([]);
  const [riwayat, setRiwayat] = useState<Riset[]>([]);
  const [sibuk, setSibuk] = useState<"riset" | "peluang" | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [catatan, setCatatan] = useState<string | null>(null);
  const [produkDiproses, setProdukDiproses] = useState<string | null>(null);

  const muatRiwayat = useCallback(async () => {
    if (!siap) return;
    try {
      setRiwayat(await daftarRiset());
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Riwayat riset gagal dimuat.");
    }
  }, [siap]);

  // Muat awal dilakukan di dalam effect dengan penanda `aktif`, mengikuti
  // pola features/konten/riwayat-supabase.tsx: setState hanya terjadi setelah
  // await, bukan langsung di badan effect.
  useEffect(() => {
    if (!siap) return;
    let aktif = true;
    const jalan = async () => {
      try {
        const data = await daftarRiset();
        if (aktif) setRiwayat(data);
      } catch (e) {
        if (aktif) setGalat(e instanceof Error ? e.message : "Riwayat riset gagal dimuat.");
      }
    };
    void jalan();
    return () => {
      aktif = false;
    };
  }, [siap]);

  const susunPeluang = useCallback(async (risetId: string) => {
    setSibuk("peluang");
    try {
      const res = await fetch("/api/audience/peluang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ risetId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        peluang?: unknown[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setGalat(data.error ?? `Peluang gagal disusun (HTTP ${res.status}).`);
        return;
      }
      const baris = (data.peluang ?? [])
        .map(barisKePeluang)
        .filter((p): p is Peluang => p !== null);
      setPeluang(baris);
      setCatatan(
        baris.length > 0
          ? `${baris.length} kategori peluang tersimpan. Pilih satu untuk dijadikan produk.`
          : "Peluang tersimpan, tapi tidak ada baris yang bisa dibaca.",
      );
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Peluang gagal disusun.");
    } finally {
      setSibuk(null);
    }
  }, []);

  const jalankanRiset = useCallback(async () => {
    setGalat(null);
    setCatatan(null);
    setPeluang([]);
    setSibuk("riset");
    try {
      const res = await fetch("/api/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, audiens }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        riset?: Riset;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.riset) {
        setGalat(data.error ?? `Riset gagal (HTTP ${res.status}).`);
        return;
      }
      setRiset(data.riset);
      setCatatan("Riset tersimpan. Menyusun peluang produk…");
      await muatRiwayat();
      setSibuk(null);
      await susunPeluang(data.riset.id);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Riset gagal dijalankan.");
    } finally {
      setSibuk(null);
    }
  }, [audiens, muatRiwayat, niche, susunPeluang]);

  const bukaRiset = useCallback(async (r: Riset) => {
    setGalat(null);
    setCatatan(null);
    setRiset(r);
    setNiche(r.niche);
    setAudiens(r.audiens);
    try {
      const baris = await daftarPeluang(r.id);
      setPeluang(baris);
      if (baris.length === 0) {
        setCatatan("Riset ini belum punya peluang. Tekan “Susun ulang peluang” untuk membuatnya.");
      }
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Peluang gagal dimuat.");
      setPeluang([]);
    }
  }, []);

  const buatProduk = useCallback(
    async (p: Peluang) => {
      if (!riset) return;
      setGalat(null);
      setProdukDiproses(p.id);
      try {
        const hasil = await jadikanProduk(riset, p);
        setPeluang((prev) =>
          prev.map((x) =>
            x.id === p.id ? { ...x, dipilih: true, produk_id: hasil.produkId } : x,
          ),
        );
        setCatatan(
          hasil.baru
            ? `Produk “${p.kategori}” dibuat. Lengkapi harga dan tautan di form produk.`
            : `Produk “${p.kategori}” sudah ada, jadi dipakai ulang.`,
        );
      } catch (e) {
        setGalat(e instanceof Error ? e.message : "Produk gagal dibuat.");
      } finally {
        setProdukDiproses(null);
      }
    },
    [riset],
  );

  return (
    <div className="space-y-6">
      {/* 1. Input riset */}
      <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
        <h2 className="text-base font-semibold">1. Riset audiens</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Satu niche dan satu target audiens menghasilkan 10 masalah nyata, lalu 20 kategori
          produk yang berpotensi dipromosikan di Threads. Semua hasil berstatus draft.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="r-niche" className="mb-1 block text-sm font-medium">
              Niche <span className="text-status-failed">*</span>
            </label>
            <input
              id="r-niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder={NICHE_AWAL}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="r-audiens" className="mb-1 block text-sm font-medium">
              Target audiens <span className="text-status-failed">*</span>
            </label>
            <input
              id="r-audiens"
              value={audiens}
              onChange={(e) => setAudiens(e.target.value)}
              placeholder={AUDIENS_CONTOH}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void jalankanRiset()}
            className={btnUtama}
            disabled={sibuk !== null || niche.trim().length < 3 || audiens.trim().length < 3}
          >
            {sibuk === "riset" ? "Meriset audiens…" : "Jalankan riset"}
          </button>
          {riset ? (
            <button
              type="button"
              onClick={() => void susunPeluang(riset.id)}
              className={btnGhost}
              disabled={sibuk !== null}
            >
              {sibuk === "peluang" ? "Menyusun peluang…" : "Susun ulang peluang"}
            </button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Niche awal dipakai sebagai default; ganti kapan saja.
          </p>
        </div>

        {!siap ? (
          <p role="alert" className="mt-3 text-sm text-status-failed">
            {PESAN_ENV_KURANG}
          </p>
        ) : null}
        {galat ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-status-failed/40 bg-muted px-3 py-2 text-sm text-status-failed"
          >
            {galat}
          </p>
        ) : null}
        {catatan ? (
          <p role="status" className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
            {catatan}
          </p>
        ) : null}
      </section>

      {/* 2. Hasil riset */}
      {riset ? (
        <section className="space-y-4 rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">2. Masalah audiens ({riset.masalah.length})</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {riset.niche} · {riset.audiens} ·{" "}
                {new Date(riset.created_at).toLocaleString("id-ID")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={btnGhost}
                onClick={() => unduhCsv(NAMA_BERKAS.riset, csvRiset(riset))}
              >
                Ekspor {NAMA_BERKAS.riset}
              </button>
              {peluang.length > 0 ? (
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => unduhCsv(NAMA_BERKAS.peluang, csvPeluang(peluang))}
                >
                  Ekspor {NAMA_BERKAS.peluang}
                </button>
              ) : null}
            </div>
          </div>

          {riset.ringkasan ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm">{riset.ringkasan}</p>
          ) : null}

          <ol className="grid gap-3 sm:grid-cols-2">
            {riset.masalah.map((m, i) => (
              <li key={`${m.masalah}-${i}`} className="rounded-lg border border-surface-border p-3">
                <div className="flex gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm font-medium">{m.masalah}</p>
                </div>
                {m.situasi ? (
                  <p className="mt-1 text-xs text-muted-foreground">{m.situasi}</p>
                ) : null}
                {m.produk_contoh.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.produk_contoh.map((p) => (
                      <span
                        key={p}
                        className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                ) : null}
                {m.alasan ? <p className="mt-2 text-xs">{m.alasan}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <EmptyState
          title="Belum ada riset dipilih"
          description="Isi niche dan target audiens di atas, lalu jalankan riset. Riwayat riset sebelumnya ada di bagian bawah."
        />
      )}

      {/* 3. Peluang produk */}
      {riset && peluang.length > 0 ? (
        <section className="space-y-3 rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
          <div>
            <h2 className="text-base font-semibold">3. Peluang produk ({peluang.length})</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tekan “Buat produk” pada kategori yang ingin dikerjakan. Produk dibuat dengan
              sumber manual; harga dan tautan diisi di form produk.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <caption className="sr-only">Daftar kategori peluang produk hasil riset</caption>
              <thead>
                <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">Kategori</th>
                  <th className="py-2 pr-3 font-medium">Prioritas</th>
                  <th className="py-2 pr-3 font-medium">Masalah terkait</th>
                  <th className="py-2 pr-3 font-medium">Contoh produk</th>
                  <th className="py-2 pr-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {urutkanPeluang(peluang).map((p) => (
                  <tr key={p.id} className="border-b border-surface-border/60 align-top">
                    <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                      {String(p.urutan).padStart(2, "0")}
                    </td>
                    <td className="max-w-[16rem] py-2 pr-3">
                      <p className="font-medium">{p.kategori}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.alasan}</p>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${labelPrioritas[p.prioritas]}`}
                      >
                        {p.prioritas}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        konten: {p.kesulitan_konten}
                      </p>
                    </td>
                    <td className="max-w-[12rem] py-2 pr-3 text-xs text-muted-foreground">
                      {p.masalah_terkait ?? "—"}
                    </td>
                    <td className="max-w-[12rem] py-2 pr-3 text-xs text-muted-foreground">
                      {p.contoh_produk.join(", ") || "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {p.dipilih && p.produk_id ? (
                        <Link
                          href="/posting/baru"
                          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Produk dibuat →
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={() => void buatProduk(p)}
                          disabled={produkDiproses !== null}
                        >
                          {produkDiproses === p.id ? "Membuat…" : "Buat produk"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* 4. Riwayat */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Riwayat riset</h2>
        {riwayat.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada riset tersimpan. Riset pertama akan muncul di sini setelah dijalankan.
          </p>
        ) : (
          <ul className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface">
            {riwayat.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium">{r.niche}</span>
                  <span className="text-muted-foreground"> · {r.audiens}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {r.masalah.length} masalah ·{" "}
                    {new Date(r.created_at).toLocaleDateString("id-ID")}
                  </span>
                </span>
                <button type="button" className={btnGhost} onClick={() => void bukaRiset(r)}>
                  {riset?.id === r.id ? "Dibuka" : "Buka"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
