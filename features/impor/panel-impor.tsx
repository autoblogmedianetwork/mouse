"use client";

/**
 * Panel impor laporan affiliate (Shopee, TikTok Shop, Tokopedia).
 *
 * Prinsip yang dipegang (AGENTS rule 5 dan PRD F1): jalur manual selalu
 * tersedia (tempel teks), pemetaan kolom bisa dikoreksi user, dan data baru
 * masuk sebagai catatan performa setelah user menekan tombol simpan.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import {
  KOLOM_LABEL,
  MARKETPLACE_LABEL,
  PILIHAN_KOLOM,
  type KolomInternal,
  type Marketplace,
} from "@/lib/impor/marketplace";
import { formatAngka, formatRupiah } from "@/lib/impor/normalisasi";
import { bacaBerkasKeTabel, bacaTabel, type OpsiBaca } from "@/lib/impor/parse";
import { ringkasPerforma } from "@/lib/impor/performa";
import type { HasilBaca } from "@/lib/impor/skema";
import { parseTabel, type Tabel } from "@/lib/impor/csv";
import { PerformaRingkas } from "./performa-ringkas";
import { usePerforma } from "./use-performa";

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const btnUtama =
  "inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";
const btnGhost = "rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium hover:bg-muted";

export function PanelImpor() {
  const { simpanan, siap, pesan, impor, hapusSemua } = usePerforma();
  const [tabel, setTabel] = useState<Tabel | null>(null);
  const [hasil, setHasil] = useState<HasilBaca | null>(null);
  const [sumber, setSumber] = useState<string>("");
  const [paksa, setPaksa] = useState<Marketplace | "auto">("auto");
  const [petaDraft, setPetaDraft] = useState<Partial<Record<KolomInternal, number>> | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [teks, setTeks] = useState("");
  const [tarik, setTarik] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const ringkasTersimpan = useMemo(() => ringkasPerforma(simpanan.baris), [simpanan.baris]);
  const ringkasPratinjau = useMemo(() => (hasil ? ringkasPerforma(hasil.baris) : null), [hasil]);

  const bacaDariTabel = useCallback(
    (
      t: Tabel,
      namaSumber: string,
      marketplace: Marketplace | "auto",
      petaManual: Partial<Record<KolomInternal, number>> | null,
    ) => {
      const opsi: OpsiBaca = {
        nama: namaSumber,
        marketplace: marketplace === "auto" ? undefined : marketplace,
        petaManual: petaManual ?? undefined,
      };
      const h = bacaTabel(t, opsi);
      setHasil(h);
      setPetaDraft(petaManual ? { ...petaManual } : { ...h.peta });
    },
    [],
  );

  const prosesBerkas = useCallback(
    async (file: File) => {
      setSibuk(true);
      setGalat(null);
      setSukses(null);
      try {
        const t = await bacaBerkasKeTabel(file);
        setTabel(t);
        setSumber(file.name);
        bacaDariTabel(t, file.name, paksa, petaDraft && Object.keys(petaDraft).length > 0 ? petaDraft : null);
      } catch (e) {
        setGalat(e instanceof Error ? e.message : "Berkas tidak bisa dibaca.");
        setHasil(null);
      } finally {
        setSibuk(false);
      }
    },
    [bacaDariTabel, paksa, petaDraft],
  );

  const prosesTempel = useCallback(() => {
    setGalat(null);
    setSukses(null);
    if (teks.trim() === "") {
      setGalat("Tempel dulu isi laporan sebelum membaca.");
      return;
    }
    try {
      const t = parseTabel(teks);
      setTabel(t);
      setSumber("tempel");
      bacaDariTabel(t, "tempel", paksa, null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Teks tidak bisa dibaca.");
      setHasil(null);
    }
  }, [bacaDariTabel, paksa, teks]);

  const gantiMarketplace = useCallback(
    (nilai: Marketplace | "auto") => {
      setPaksa(nilai);
      if (tabel) bacaDariTabel(tabel, sumber || "tempel", nilai, petaDraft);
    },
    [bacaDariTabel, petaDraft, sumber, tabel],
  );

  const simpan = () => {
    if (!hasil || hasil.baris.length === 0) return;
    const disimpan = impor(hasil);
    if (!disimpan) {
      setGalat(pesan ?? "Gagal menyimpan data performa.");
      return;
    }
    setGalat(null);
    setSukses(
      `${formatAngka(disimpan.sumber.baris)} baris dari ${disimpan.sumber.nama} disimpan: ` +
        `${disimpan.ditambah} baris baru, ${disimpan.diperbarui} baris diperbarui.`,
    );
  };

  // Dropdown pemetaan menampilkan pilihan yang sedang diedit (draft), bukan
  // peta yang sudah diterapkan, supaya user bisa melihat perubahannya.
  const kolomDraft = useMemo(() => {
    const map = new Map<number, KolomInternal>();
    for (const [intern, idx] of Object.entries(petaDraft ?? {})) {
      if (typeof idx === "number") map.set(idx, intern as KolomInternal);
    }
    return map;
  }, [petaDraft]);

  const petaBerubah = useMemo(() => {
    if (!hasil) return false;
    return JSON.stringify(petaDraft ?? {}) !== JSON.stringify(hasil.peta);
  }, [hasil, petaDraft]);

  return (
    <div className="space-y-6">
      {/* 1. Sumber data */}
      <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
        <h2 className="text-base font-semibold">1. Pilih berkas ekspor</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Unggah ekspor komisi atau pesanan dari Shopee Affiliate, TikTok Shop Affiliate, atau
          Tokopedia Affiliate (.xlsx, .csv, .tsv). Jalur manual juga tersedia: tempel isi laporan di
          kotak bawah.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setTarik(true);
          }}
          onDragLeave={() => setTarik(false)}
          onDrop={(e) => {
            e.preventDefault();
            setTarik(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void prosesBerkas(f);
          }}
          className={`mt-4 rounded-xl border border-dashed p-6 text-center transition-colors ${
            tarik ? "border-primary bg-muted" : "border-surface-border"
          }`}
        >
          <p className="text-sm text-muted-foreground">
            Tarik berkas ke sini, atau
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="ml-1 font-medium text-primary underline-offset-2 hover:underline"
            >
              pilih berkas
            </button>
            .
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xlsm,.csv,.tsv,.txt,text/csv"
            className="hidden"
            aria-label="Berkas ekspor affiliate"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void prosesBerkas(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="tempel-laporan" className="text-sm font-medium">
            Atau tempel isi laporan
          </label>
          <textarea
            id="tempel-laporan"
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            rows={4}
            placeholder={"Nama Produk;ID Pesanan;Status Pesanan;Komisi\nTas Kanvas;A123;Selesai;12000"}
            className={`${inputClass} font-mono text-xs`}
          />
          <button type="button" onClick={prosesTempel} className={btnGhost} disabled={sibuk}>
            Baca teks yang ditempel
          </button>
        </div>

        {sibuk ? <p className="mt-3 text-sm text-muted-foreground">Membaca berkas…</p> : null}
        {galat ? (
          <p role="alert" className="mt-3 rounded-lg border border-status-failed/40 bg-muted px-3 py-2 text-sm text-status-failed">
            {galat}
          </p>
        ) : null}
      </section>

      {/* 2. Hasil deteksi dan pratinjau */}
      {hasil ? (
        <section className="space-y-4 rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">2. Periksa hasil pembacaan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sumber <span className="font-medium text-foreground">{hasil.nama_sumber}</span> ·
                pemisah {hasil.pemisah === "xlsx" ? "Excel" : `"${hasil.pemisah}"`}
                {hasil.baris_dilewati > 0 ? ` · ${hasil.baris_dilewati} baris judul dilewati` : ""}
              </p>
              <p className="mt-1 text-sm">
                Terdeteksi:{" "}
                <span className="font-medium">{MARKETPLACE_LABEL[hasil.marketplace]}</span>{" "}
                <span className="text-muted-foreground">({hasil.alasan_deteksi})</span>
              </p>
            </div>
            <label className="text-sm">
              <span className="mr-2 text-muted-foreground">Marketplace</span>
              <select
                value={paksa}
                onChange={(e) => gantiMarketplace(e.target.value as Marketplace | "auto")}
                className={`${inputClass} inline-block w-auto`}
              >
                <option value="auto">Deteksi otomatis</option>
                <option value="shopee">Shopee Affiliate</option>
                <option value="tiktok">TikTok Shop Affiliate</option>
                <option value="tokopedia">Tokopedia Affiliate</option>
                <option value="lainnya">Format generik</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="rounded-lg bg-muted px-3 py-1.5">
              {formatAngka(hasil.baris.length)} baris siap disimpan
            </span>
            <span className="rounded-lg bg-muted px-3 py-1.5">
              {formatAngka(hasil.total_baris)} baris dibaca
            </span>
            <span className="rounded-lg bg-muted px-3 py-1.5">
              {formatAngka(hasil.ditolak.length)} baris dilewati
            </span>
            {hasil.kolom_tak_dikenali.length > 0 ? (
              <span className="rounded-lg bg-muted px-3 py-1.5 text-muted-foreground">
                Kolom tak dipakai: {hasil.kolom_tak_dikenali.join(", ")}
              </span>
            ) : null}
          </div>

          {hasil.kolom_kurang.length > 0 ? (
            <p role="alert" className="rounded-lg border border-status-failed/40 bg-muted px-3 py-2 text-sm">
              Kolom wajib belum ketemu: {hasil.kolom_kurang.map((k) => KOLOM_LABEL[k as KolomInternal] ?? k).join(", ")}.
              Petakan kolom secara manual di bawah.
            </p>
          ) : null}

          {/* Pemetaan kolom */}
          <details open={hasil.kolom_kurang.length > 0} className="rounded-lg border border-surface-border">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
              Ubah pemetaan kolom ({Object.keys(hasil.peta).length} dari {hasil.header.length})
            </summary>
            <div className="space-y-2 border-t border-surface-border p-3">
              {hasil.header.map((namaKolom, idx) => {
                const terpakai = kolomDraft.get(idx);
                return (
                  <div key={`${namaKolom}-${idx}`} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate" title={namaKolom}>
                      {namaKolom || `(kolom ${idx + 1} tanpa nama)`}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <select
                      value={terpakai ?? ""}
                      aria-label={`Pemetaan kolom ${namaKolom || idx + 1}`}
                      className={`${inputClass} w-full sm:w-56`}
                      onChange={(e) => {
                        const nilai = e.target.value as KolomInternal | "";
                        setPetaDraft((prev) => {
                          const next: Partial<Record<KolomInternal, number>> = { ...(prev ?? hasil.peta) };
                          // buang pemetaan lama untuk kolom ini dan untuk field yang dipilih
                          const map = new Map<number, KolomInternal>();
                          for (const [k, i] of Object.entries(next)) map.set(i as number, k as KolomInternal);
                          const fieldLama = map.get(idx);
                          if (fieldLama) delete next[fieldLama];
                          if (nilai !== "") next[nilai] = idx;
                          return next;
                        });
                      }}
                    >
                      <option value="">— tidak dipakai —</option>
                      {PILIHAN_KOLOM.map((p) => (
                        <option key={p.nilai} value={p.nilai}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={btnUtama}
                  disabled={!tabel}
                  onClick={() => tabel && bacaDariTabel(tabel, sumber || "tempel", paksa, petaDraft)}
                >
                  Terapkan pemetaan
                </button>
                {petaBerubah ? (
                  <span className="text-xs text-muted-foreground">
                    Pemetaan belum diterapkan — tekan tombol untuk membaca ulang baris.
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Pemetaan sudah diterapkan.</span>
                )}
              </div>
            </div>
          </details>

          {/* Pratinjau baris */}
          {hasil.baris.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <caption className="sr-only">Pratinjau baris performa hasil impor</caption>
                <thead>
                  <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Produk</th>
                    <th className="py-2 pr-3 font-medium">ID pesanan</th>
                    <th className="py-2 pr-3 font-medium">Tanggal</th>
                    <th className="py-2 pr-3 font-medium">Komisi</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.baris.slice(0, 8).map((b) => (
                    <tr key={b.id} className="border-b border-surface-border/60">
                      <td className="max-w-[18rem] truncate py-2 pr-3">{b.produk || "—"}</td>
                      <td className="py-2 pr-3 tabular-nums text-muted-foreground">{b.id_pesanan || "—"}</td>
                      <td className="py-2 pr-3 tabular-nums text-muted-foreground">{b.tanggal ?? "—"}</td>
                      <td className="py-2 pr-3 tabular-nums">{formatRupiah(b.komisi)}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{b.status_pesanan || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasil.baris.length > 8 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Menampilkan 8 dari {formatAngka(hasil.baris.length)} baris.
                </p>
              ) : null}
            </div>
          ) : null}

          {hasil.ditolak.length > 0 ? (
            <div className="rounded-lg border border-surface-border p-3">
              <p className="text-sm font-medium">Baris yang dilewati</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {hasil.ditolak.slice(0, 5).map((d) => (
                  <li key={d.nomor}>
                    Baris {d.nomor}: {d.alasan}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {ringkasPratinjau ? (
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="rounded-lg bg-muted px-3 py-1.5">
                Komisi terbaca: <span className="font-medium">{formatRupiah(ringkasPratinjau.komisi)}</span>
              </span>
              <span className="rounded-lg bg-muted px-3 py-1.5">
                GMV: <span className="font-medium">{formatRupiah(ringkasPratinjau.gmv)}</span>
              </span>
              <span className="rounded-lg bg-muted px-3 py-1.5">
                {formatAngka(ringkasPratinjau.pesanan)} pesanan ·{" "}
                {formatAngka(ringkasPratinjau.produk)} produk
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-surface-border pt-4">
            <button type="button" className={btnUtama} onClick={simpan} disabled={hasil.baris.length === 0}>
              Simpan ke dashboard
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                setHasil(null);
                setTabel(null);
                setSukses(null);
                setGalat(null);
                setTeks("");
              }}
            >
              Batalkan
            </button>
            <p className="text-xs text-muted-foreground">
              Data masuk sebagai catatan performa. Konten dan status posting tidak berubah.
            </p>
          </div>

          {sukses ? (
            <p role="status" className="rounded-lg bg-muted px-3 py-2 text-sm text-status-ready">
              {sukses}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* 3. Data tersimpan */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">3. Performa tersimpan</h2>
          {simpanan.baris.length > 0 ? (
            <button type="button" className={btnGhost} onClick={() => setKonfirmasi(true)}>
              Hapus semua data performa
            </button>
          ) : null}
        </div>

        {!siap ? (
          <p className="text-sm text-muted-foreground">Memuat data tersimpan…</p>
        ) : simpanan.baris.length === 0 ? (
          <EmptyState
            title="Belum ada data performa"
            description="Impor laporan komisi pertama Anda. Setelah tersimpan, dashboard dan halaman Analitik langsung menampilkan komisi, GMV, produk terlaris, dan tren bulanan."
          />
        ) : (
          <>
            <PerformaRingkas ringkas={ringkasTersimpan} />

            <div className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
              <h3 className="text-base font-semibold">Riwayat impor</h3>
              <ul className="mt-3 divide-y divide-surface-border">
                {simpanan.sumber.slice(0, 8).map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <span className="min-w-0 truncate font-medium">{s.nama}</span>
                    <span className="text-xs text-muted-foreground">
                      {MARKETPLACE_LABEL[s.marketplace]} · {formatAngka(s.baris)} baris
                      {s.ditolak > 0 ? ` · ${formatAngka(s.ditolak)} dilewati` : ""} ·{" "}
                      {formatRupiah(s.komisi)} · {new Date(s.diimpor_pada).toLocaleString("id-ID")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {pesan ? <p className="text-sm text-muted-foreground">{pesan}</p> : null}
      </section>

      <ConfirmDialog
        open={konfirmasi}
        judul="Hapus semua data performa?"
        pesan="Seluruh baris hasil impor di peramban ini akan dihapus. Berkas aslinya tidak terpengaruh, jadi Anda bisa mengimpor ulang kapan saja."
        labelKonfirmasi="Hapus semua"
        onKonfirmasi={() => {
          hapusSemua();
          setKonfirmasi(false);
          setSukses(null);
        }}
        onBatal={() => setKonfirmasi(false)}
      />
    </div>
  );
}
