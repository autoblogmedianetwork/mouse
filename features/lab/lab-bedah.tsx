"use client";

/**
 * BagianBedah — ide #4 (riset 17 Nov): tempel SATU postingan orang lain
 * yang perform bagus, AI membedah anatominya (hook, CTA, struktur,
 * pelajaran). Edukasi, bukan penulisan ulang — beda dengan Mirror.
 * Anti-plagiat ditegakkan prompt: maksimal 5 kata berturut-turut.
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/card";
import { cn } from "@/lib/utils";
import { inputClass, btnPrimary, btnGhost, PesanGalat, panggilAI } from "./lab-bersama";
import type { BedahPostingan } from "@/lib/ai/schemas";
import {
  hapusPelajaran,
  muatPelajaran,
  ringkasPelajaran,
  simpanPelajaran,
  tambahPelajaran,
  type Pelajaran,
} from "@/lib/konten/pelajaran";

const LABEL_HOOK: Record<string, string> = {
  pertanyaan: "Pertanyaan",
  masalah_relatif: "Masalah relatable",
  pernyataan_mengejutkan: "Pernyataan mengejutkan",
  lainnya: "Lainnya",
};

const LABEL_CTA: Record<string, string> = {
  beli_sekarang: "Beli sekarang",
  cek_bio: "Cek bio",
  tanya_di_komentar: "Tanya di komentar",
  simpan_atau_bagikan: "Simpan atau bagikan",
  tanya_pengalaman: "Tanya pengalaman",
  tidak_ada: "Tanpa CTA",
};

export function BagianBedah() {
  const [postingan, setPostingan] = useState("");
  const [sumber, setSumber] = useState("");
  const [hasil, setHasil] = useState<BedahPostingan | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const [pesanSimpan, setPesanSimpan] = useState("");
  const [pelajaran, setPelajaran] = useState<Pelajaran[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- muat localStorage setelah mount agar markup server dan klien sama
    setPelajaran(muatPelajaran());
  }, []);

  const simpanKePelajaran = () => {
    if (!hasil) return;
    const hasilTambah = tambahPelajaran(pelajaran, {
      sumber,
      hookJenis: hasil.hook.jenis,
      hookPenjelasan: hasil.hook.penjelasan,
      ctaJenis: hasil.cta.jenis,
      ctaAda: hasil.cta.ada,
      pelajaran: hasil.pelajaran,
    });
    if (!hasilTambah.ok) {
      setPesanSimpan(hasilTambah.galat);
      return;
    }
    setPelajaran(hasilTambah.data);
    simpanPelajaran(hasilTambah.data);
    setPesanSimpan("Tersimpan di kumpulan pelajaran ✓");
  };

  const hapus = (id: string) => {
    const sisa = hapusPelajaran(pelajaran, id);
    setPelajaran(sisa);
    simpanPelajaran(sisa);
  };

  const jalankan = async () => {
    if (postingan.trim().length < 40) {
      setGalat("Postingan minimal 40 karakter supaya cukup dibedah.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<BedahPostingan>("/api/ai/bedah-postingan", {
      postingan: postingan.trim(),
    });
    setMemuat(false);
    if (!res.ok || !res.data) {
      setHasil(null);
      setGalat(res.error ?? "Gagal membedah.");
      return;
    }
    setHasil(res.data);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">Bedah postingan (belajar dari orang lain)</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Tempel SATU postingan orang lain yang menurutmu bagus — AI membedah anatominya:
        jenis hook, jenis CTA, urutan bagian, dan pelajaran yang bisa kamu terapkan.
        Ini kelas belajar, bukan mesin tiruan (untuk menulis ulang gaya, pakai Mirror di bawah).
      </p>
      <textarea
        value={postingan}
        onChange={(e) => setPostingan(e.target.value)}
        rows={6}
        placeholder="Tempel postingan di sini…"
        className={cn(inputClass, "mt-3 resize-y")}
      />
      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Membedah…" : "Bedah strukturnya"}
      </button>
      <PesanGalat pesan={galat} />

      {hasil ? (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4 text-badan">
          <p>
            <span className="font-mono text-meta uppercase tracking-meta text-muted-foreground">Hook:</span>{" "}
            {LABEL_HOOK[hasil.hook.jenis] ?? hasil.hook.jenis} — {hasil.hook.penjelasan}
          </p>
          <p>
            <span className="font-mono text-meta uppercase tracking-meta text-muted-foreground">CTA:</span>{" "}
            {hasil.cta.ada ? LABEL_CTA[hasil.cta.jenis] ?? hasil.cta.jenis : "Tanpa CTA"} — {hasil.cta.penjelasan}
          </p>
          <p>
            <span className="font-mono text-meta uppercase tracking-meta text-muted-foreground">Ukuran:</span>{" "}
            {hasil.panjang_karakter} karakter · {hasil.jumlah_bagian} bagian
          </p>
          <div>
            <p className="font-mono text-meta uppercase tracking-meta text-muted-foreground">Struktur:</p>
            <ol className="mt-1 list-decimal pl-5">
              {hasil.struktur.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className="font-mono text-meta uppercase tracking-meta text-muted-foreground">Pelajaran buatmu:</p>
            <ul className="mt-1 list-disc pl-5">
              {hasil.pelajaran.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          {hasil.kejujuran === "ragu" ? (
            <p role="alert" className="border border-warning/40 bg-warning/10 px-3 py-2 text-meta text-warning-foreground">
              Catatan kejujuran: {hasil.peringatan || "postingan ini memuat klaim yang melebih-lebihkan — jangan dijadikan teladan."}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={sumber}
              onChange={(e) => setSumber(e.target.value)}
              placeholder="Nama/topik postingan (opsional)…"
              aria-label="Sumber pelajaran"
              className="w-full max-w-xs border border-surface-border bg-surface px-3 py-1.5 text-badan outline-none focus:border-primary"
            />
            <button type="button" onClick={simpanKePelajaran} className={btnPrimary}>
              Simpan ke kumpulan pelajaran
            </button>
            {pesanSimpan ? <span className="text-meta text-muted-foreground">{pesanSimpan}</span> : null}
          </div>
        </div>
      ) : null}

      {pelajaran.length > 0 ? (
        <details className="mt-4 border-t border-surface-border pt-4">
          <summary className="cursor-pointer text-badan font-medium">
            Kumpulan pelajaran ({pelajaran.length}) — rujukan saat menulis
          </summary>
          <ul className="mt-2 space-y-2">
            {pelajaran.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-2 border border-surface-border bg-surface p-2">
                <div className="min-w-0">
                  <p className="text-meta font-semibold">{p.sumber}</p>
                  <p className="text-badan">{ringkasPelajaran(p)}</p>
                </div>
                <button type="button" className={btnGhost} onClick={() => hapus(p.id)} aria-label={`Hapus pelajaran ${p.sumber}`}>
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </Card>
  );
}
