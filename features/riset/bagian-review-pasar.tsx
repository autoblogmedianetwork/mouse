/**
 * Bagian 1a + 1b: pelajaran dari performa (Fase 3-E) dan review pasar
 * (Fase 3-C). Dipecah dari panel-riset.tsx (R6c) — state review kini lokal.
 */
import { useState } from "react";
import { Card } from "@/components/card";
import { useAtribusi } from "@/features/performa/use-atribusi";
import { rekomendasiDariPerforma } from "@/lib/performa/rekomendasi";
import type { ReviewPasar } from "@/lib/ai/schemas";
import { btnUtama, inputClass } from "./riset-bersama";

export function BagianPelajaranPerforma() {
  const atribusi = useAtribusi();
  const rekomendasi = rekomendasiDariPerforma(atribusi.hasil);

  return (
    <Card>
      <h2 className="text-isi font-semibold">Pelajaran dari performa Anda</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Dihitung dari data Analitik Anda sendiri — gaya pembuka dan posisi link
        yang terbukti menghasilkan.
      </p>
      <ul className="mt-3 space-y-2">
        {rekomendasi.map((r) => (
          <li key={r.dimensi} className="border border-surface-border p-3 text-badan">
            <span className="font-medium">{r.teks}</span>
          </li>
        ))}
      </ul>
      {!atribusi.siap ? (
        <p className="mt-2 text-meta text-muted-foreground">Memuat data performa…</p>
      ) : null}
    </Card>
  );
}

interface PropsReview {
  niche: string;
  audiens: string;
  /** Simpan masalah hasil review ke bank (Fase 3-D). */
  simpanKeBank: (
    masalah: readonly string[],
    kategori: string,
    sumber: "riset" | "review",
  ) => void;
}

export function BagianReviewPasar({ niche, audiens, simpanKeBank }: PropsReview) {
  // Fase 3-C: review pasar — tempel review marketplace, AI ekstrak pola.
  const [reviewMentah, setReviewMentah] = useState("");
  const [hasilReview, setHasilReview] = useState<ReviewPasar | null>(null);
  const [sibukReview, setSibukReview] = useState(false);
  const [galatReview, setGalatReview] = useState<string | null>(null);

  const analisisReview = async () => {
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
      // Fase 3-D: masalah + kekurangan asli masuk bank otomatis.
      simpanKeBank(
        [...json.hasil.masalah, ...json.hasil.kekurangan_asli],
        niche.trim(),
        "review",
      );
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
  };

  return (
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
  );
}
