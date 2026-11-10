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
import { Card } from "@/components/card";
import { PesanGalat } from "@/components/pesan-galat";
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
import {
  KARTU_PERSONA,
  PILIHAN_GENDER,
  PILIHAN_MINAT,
  PILIHAN_PERILAKU,
  PILIHAN_USIA,
  bangunDeskripsiAudiens,
  type PilihanAudiens,
} from "@/lib/riset/preset";
import { PemilihChip } from "@/components/pemilih-chip";
import type { ReviewPasar } from "@/lib/ai/schemas";
import { AMBANG_DIREKOMENDASIKAN, direkomendasikan } from "@/lib/riset/skor-peluang";
import { PESAN_ENV_KURANG, supabaseSiap } from "@/lib/supabase/klien";

const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
const btnUtama =
  "inline-flex h-9 items-center bg-primary px-4 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";
const btnGhost =
  "border border-surface-border px-3 py-1.5 text-meta font-medium hover:bg-muted disabled:opacity-60";

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
  // Fase 3-B: pilihan preset (kartu persona + chip ala Meta Ads).
  const [usiaPilih, setUsiaPilih] = useState<string | null>(null);
  const [genderPilih, setGenderPilih] = useState<string | null>(null);
  const [minatPilih, setMinatPilih] = useState<string[]>([]);
  const [perilakuPilih, setPerilakuPilih] = useState<string[]>([]);
  // Fase 3-C: review pasar — tempel review marketplace, AI ekstrak pola.
  const [reviewMentah, setReviewMentah] = useState("");
  const [hasilReview, setHasilReview] = useState<ReviewPasar | null>(null);
  const [sibukReview, setSibukReview] = useState(false);
  const [galatReview, setGalatReview] = useState<string | null>(null);
  const [riset, setRiset] = useState<Riset | null>(null);
  const [peluang, setPeluang] = useState<Peluang[]>([]);
  const [riwayat, setRiwayat] = useState<Riset[]>([]);
  const [sibuk, setSibuk] = useState<"riset" | "peluang" | null>(null);
  const [galat, setGalat] = useState<{ pesan: string; perluMasuk: boolean } | null>(null);
  const [catatan, setCatatan] = useState<string | null>(null);
  const [produkDiproses, setProdukDiproses] = useState<string | null>(null);

  const muatRiwayat = useCallback(async () => {
    if (!siap) return;
    try {
      setRiwayat(await daftarRiset());
    } catch (e) {
      setGalat({ pesan: e instanceof Error ? e.message : "Riwayat riset gagal dimuat.", perluMasuk: false });
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
        if (aktif) {
          setGalat({
            pesan: e instanceof Error ? e.message : "Riwayat riset gagal dimuat.",
            perluMasuk: false,
          });
        }
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
        setGalat({
          pesan: data.error ?? `Peluang gagal disusun (HTTP ${res.status}).`,
          perluMasuk: res.status === 401,
        });
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
      setGalat({ pesan: e instanceof Error ? e.message : "Peluang gagal disusun.", perluMasuk: false });
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
        setGalat({
          pesan: data.error ?? `Riset gagal (HTTP ${res.status}).`,
          perluMasuk: res.status === 401,
        });
        return;
      }
      setRiset(data.riset);
      setCatatan("Riset tersimpan. Menyusun peluang produk…");
      await muatRiwayat();
      setSibuk(null);
      await susunPeluang(data.riset.id);
    } catch (e) {
      setGalat({ pesan: e instanceof Error ? e.message : "Riset gagal dijalankan.", perluMasuk: false });
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
      setGalat({ pesan: e instanceof Error ? e.message : "Peluang gagal dimuat.", perluMasuk: false });
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
        setGalat({ pesan: e instanceof Error ? e.message : "Produk gagal dibuat.", perluMasuk: false });
      } finally {
        setProdukDiproses(null);
      }
    },
    [riset],
  );

  const toggleDari = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => (nilai: string) =>
    setter((prev) =>
      prev.includes(nilai) ? prev.filter((x) => x !== nilai) : [...prev, nilai],
    );

  const analisisReview = useCallback(async () => {
    if (reviewMentah.trim().length < 30) {
      setGalatReview("Tempel minimal satu review lengkap (bisa campuran keluhan dan pujian).");
      return;
    }
    setSibukReview(true);
    setGalatReview(null);
    try {
      const res = await fetch("/api/riset/review-pasar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: niche.trim(),
          audiens: audiens.trim() || "umum",
          review_mentah: reviewMentah.trim(),
        }),
      });
      const json = (await res.json()) as { ok: boolean; hasil?: ReviewPasar; error?: string };
      if (!res.ok || !json.ok || !json.hasil) {
        setGalatReview(json.error ?? "Analisis review gagal.");
        return;
      }
      setHasilReview(json.hasil);
      try {
        window.localStorage.setItem(
          "autothreads-review-pasar",
          JSON.stringify({ niche, hasil: json.hasil, updatedAt: new Date().toISOString() }),
        );
      } catch {
        // storage tidak tersedia: hasil tetap tampil di layar
      }
    } catch {
      setGalatReview("Tidak bisa menghubungi server. Coba lagi.");
    } finally {
      setSibukReview(false);
    }
  }, [niche, audiens, reviewMentah]);

  const pilihan: PilihanAudiens = {
    usia: usiaPilih ?? undefined,
    gender: genderPilih ?? undefined,
    minat: minatPilih,
    perilaku: perilakuPilih,
  };
  const pratinjauPreset = bangunDeskripsiAudiens(pilihan);

  return (
    <div className="space-y-6">
      {/* 1. Input riset */}
      <Card>
        <h2 className="text-isi font-semibold">1. Niche &amp; audiens</h2>
        <p className="mt-1 text-badan text-muted-foreground">
          Satu niche dan satu target audiens menghasilkan 10 masalah nyata, lalu 20 kategori
          produk yang berpotensi dipromosikan di Threads. Semua hasil berstatus draft.
        </p>

        {/* Fase 3-B: preset tinggal pilih — kartu persona + chip ala Meta Ads. */}
        <div className="mt-4">
          <p className="mb-2 text-badan font-medium">Kartu persona (tinggal pilih)</p>
          <div className="flex flex-wrap gap-2">
            {KARTU_PERSONA.map((kartu) => (
              <button
                key={kartu.id}
                type="button"
                title={kartu.deskripsi}
                onClick={() => {
                  setAudiens(kartu.deskripsi);
                  setUsiaPilih(null);
                  setGenderPilih(null);
                  setMinatPilih([]);
                  setPerilakuPilih([]);
                }}
                className="h-8 border border-surface-border bg-surface px-3 text-meta font-medium transition-colors hover:border-primary"
              >
                {kartu.nama}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-badan font-medium">
            Atau rakit sendiri (ala iklan Meta):
          </p>
          <div className="space-y-2">
            <PemilihChip
              labelGrup="Usia"
              pilihan={PILIHAN_USIA}
              terpilih={usiaPilih ? [usiaPilih] : []}
              onPilih={(v) => setUsiaPilih((prev) => (prev === v ? null : v))}
            />
            <PemilihChip
              labelGrup="Gender"
              pilihan={PILIHAN_GENDER}
              terpilih={genderPilih ? [genderPilih] : []}
              onPilih={(v) => setGenderPilih((prev) => (prev === v ? null : v))}
            />
            <PemilihChip
              labelGrup="Minat"
              pilihan={PILIHAN_MINAT}
              terpilih={minatPilih}
              multi
              onPilih={toggleDari(setMinatPilih)}
            />
            <PemilihChip
              labelGrup="Perilaku belanja"
              pilihan={PILIHAN_PERILAKU}
              terpilih={perilakuPilih}
              multi
              onPilih={toggleDari(setPerilakuPilih)}
            />
          </div>
          {pratinjauPreset ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-badan text-muted-foreground">
                Hasil rakitan: <span className="text-foreground">{pratinjauPreset}</span>
              </p>
              <button
                type="button"
                className={btnGhost}
                onClick={() => setAudiens(pratinjauPreset)}
              >
                Pakai untuk riset
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="r-niche" className="mb-1 block text-badan font-medium">
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
            <label htmlFor="r-audiens" className="mb-1 block text-badan font-medium">
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
          <p className="text-meta text-muted-foreground">
            Niche awal dipakai sebagai default; ganti kapan saja.
          </p>
        </div>

        {!siap ? (
          <p role="alert" className="mt-3 text-badan text-status-failed">
            {PESAN_ENV_KURANG}
          </p>
        ) : null}
        {galat ? (
          <PesanGalat
            pesan={galat.pesan}
            perluMasuk={galat.perluMasuk}
            className="mt-3 border border-status-failed/40 bg-muted px-3 py-2"
          />
        ) : null}
        {catatan ? (
          <p role="status" className="mt-3 bg-muted px-3 py-2 text-badan">
            {catatan}
          </p>
        ) : null}
      </Card>

      {/* 1b. Review pasar (Fase 3-C): riset dari data pasar nyata */}
      <Card>
        <h2 className="text-isi font-semibold">Review pasar (opsional, disarankan)</h2>
        <p className="mt-1 text-badan text-muted-foreground">
          Buka halaman produk di marketplace, salin 5–10 review — campuran
          <strong> 5 keluhan (1–2 bintang) + 5 pujian (4–5 bintang)</strong> — lalu tempel di
          sini. AI memilah masalah nyata, angle yang terbukti, dan kosakata pembeli.
          Nama pembeli sebaiknya dibuang sebelum ditempel.
        </p>
        <textarea
          rows={6}
          value={reviewMentah}
          onChange={(e) => setReviewMentah(e.target.value)}
          placeholder={'5 — barang bagus, pengiriman cepat | 1 — tutupnya cepat longgar, kecewa | 4 — bagus tapi agak kecil dari foto'}
          className={`${inputClass} mt-3 font-mono`}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void analisisReview()} disabled={sibukReview} className={btnUtama}>
            {sibukReview ? "Menganalisis review…" : "Analisis review"}
          </button>
          {galatReview ? (
            <p className="text-badan text-status-failed" role="alert">
              {galatReview}
            </p>
          ) : null}
        </div>

        {hasilReview ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(
              [
                ["Masalah nyata", hasilReview.masalah],
                ["Angle terbukti", hasilReview.angle],
                ["Kosakata pembeli", hasilReview.kosakata],
                ["Klaim yang dihindari", hasilReview.red_flag],
                ["Kekurangan asli", hasilReview.kekurangan_asli],
              ] as const
            ).map(([judul, daftar]) =>
              daftar.length > 0 ? (
                <div key={judul} className="border border-surface-border p-3">
                  <p className="text-meta font-semibold uppercase tracking-meta text-muted-foreground">
                    {judul}
                  </p>
                  <ul className="mt-1 list-inside list-disc text-badan">
                    {daftar.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
            <div className="border border-surface-border p-3 sm:col-span-2">
              <p className="text-meta font-semibold uppercase tracking-meta text-muted-foreground">
                Klasifikasi per review
              </p>
              <ul className="mt-1 text-meta text-muted-foreground">
                {hasilReview.klasifikasi.map((k, i) => (
                  <li key={i}>
                    [{k.jenis}
                    {k.bintang ? ` · ${k.bintang}★` : ""}] {k.ringkas}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Card>

      {/* 2. Hasil riset */}
      {riset ? (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-isi font-semibold">2. Masalah audiens ({riset.masalah.length})</h2>
              <p className="mt-1 text-badan text-muted-foreground">
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
            <p className="bg-muted px-3 py-2 text-badan">{riset.ringkasan}</p>
          ) : null}

          <ol className="grid gap-3 sm:grid-cols-2">
            {riset.masalah.map((m, i) => (
              <li key={`${m.masalah}-${i}`} className="border border-surface-border p-3">
                <div className="flex gap-2">
                  <span className="font-mono text-meta text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-badan font-medium">{m.masalah}</p>
                </div>
                {m.situasi ? (
                  <p className="mt-1 text-meta text-muted-foreground">{m.situasi}</p>
                ) : null}
                {m.produk_contoh.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.produk_contoh.map((p) => (
                      <span
                        key={p}
                        className="bg-muted px-2 py-0.5 text-meta text-muted-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                ) : null}
                {m.alasan ? <p className="mt-2 text-meta">{m.alasan}</p> : null}
              </li>
            ))}
          </ol>
        </Card>
      ) : (
        <EmptyState
          title="Belum ada riset dipilih"
          description="Isi niche dan target audiens di atas, lalu jalankan riset. Riwayat riset sebelumnya ada di bagian bawah."
        />
      )}

      {/* 3. Peluang produk */}
      {riset && peluang.length > 0 ? (
        <Card className="space-y-3">
          <div>
            <h2 className="text-isi font-semibold">3. Peluang produk ({peluang.length})</h2>
            <p className="mt-1 text-badan text-muted-foreground">
              Tekan “Buat produk” pada kategori yang ingin dikerjakan. Produk dibuat dengan
              sumber manual; harga dan tautan diisi di form produk.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-badan">
              <caption className="sr-only">Daftar kategori peluang produk hasil riset</caption>
              <thead>
                <tr className="border-b border-surface-border text-left font-mono text-meta uppercase tracking-meta text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">Kategori</th>
                  <th className="py-2 pr-3 font-medium">Skor</th>
                    <th className="py-2 pr-3 font-medium">Prioritas</th>
                  <th className="py-2 pr-3 font-medium">Masalah terkait</th>
                  <th className="py-2 pr-3 font-medium">Contoh produk</th>
                  <th className="py-2 pr-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {urutkanPeluang(peluang).map((p) => (
                  <tr key={p.id} className="border-b border-surface-border/60 align-top">
                    <td className="py-2 pr-3 font-mono text-meta text-muted-foreground">
                      {String(p.urutan).padStart(2, "0")}
                    </td>
                    <td className="max-w-[16rem] py-2 pr-3">
                      <p className="font-medium">{p.kategori}</p>
                      <p className="mt-0.5 text-meta text-muted-foreground">{p.alasan}</p>
                    </td>
                    <td className="py-2 pr-3">
                      {p.skor_total ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-meta font-medium ${
                            direkomendasikan(p)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                          title={
                            p.skor
                              ? `permintaan ${p.skor.permintaan ?? "-"}: ${p.skor.alasan_permintaan ?? "-"}; kompetisi ${p.skor.kompetisi ?? "-"}: ${p.skor.alasan_kompetisi ?? "-"}; kemudahan konten ${p.skor.kemudahan_konten ?? "-"}: ${p.skor.alasan_kemudahan_konten ?? "-"}; komisi ${p.skor.potensi_komisi ?? "-"}: ${p.skor.alasan_potensi_komisi ?? "-"}`
                              : undefined
                          }
                        >
                          {p.skor_total}/20{direkomendasikan(p) ? " ★" : ""}
                        </span>
                      ) : (
                        <span className="text-meta text-muted-foreground">—</span>
                      )}
                      {p.skor_total ? (
                        <p className="mt-1 text-meta text-muted-foreground">
                          layak duluan &ge; {AMBANG_DIREKOMENDASIKAN}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-meta font-medium ${labelPrioritas[p.prioritas]}`}
                      >
                        {p.prioritas}
                      </span>
                      <p className="mt-1 text-meta text-muted-foreground">
                        konten: {p.kesulitan_konten}
                      </p>
                    </td>
                    <td className="max-w-[12rem] py-2 pr-3 text-meta text-muted-foreground">
                      {p.masalah_terkait ?? "—"}
                    </td>
                    <td className="max-w-[12rem] py-2 pr-3 text-meta text-muted-foreground">
                      {p.contoh_produk.join(", ") || "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {p.dipilih && p.produk_id ? (
                        <Link
                          href="/posting/baru"
                          className="text-meta font-medium text-primary underline-offset-2 hover:underline"
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
        </Card>
      ) : null}

      {/* 4. Riwayat */}
      <section className="space-y-3">
        <h2 className="text-isi font-semibold">Riwayat riset</h2>
        {riwayat.length === 0 ? (
          <p className="text-badan text-muted-foreground">
            Belum ada riset tersimpan. Riset pertama akan muncul di sini setelah dijalankan.
          </p>
        ) : (
          <Card padat>
            <ul className="divide-y divide-surface-border">
            {riwayat.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-badan"
              >
                <span className="min-w-0">
                  <span className="font-medium">{r.niche}</span>
                  <span className="text-muted-foreground"> · {r.audiens}</span>
                  <span className="ml-2 text-meta text-muted-foreground">
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
          </Card>
        )}
      </section>
    </div>
  );
}
