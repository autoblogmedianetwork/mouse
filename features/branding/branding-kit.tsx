"use client";

/**
 * Personal Branding Kit — 7 postingan pembuka untuk akun baru (Hari 1-7).
 *
 * Dua jalan per hari, bebas dipilih:
 * - Manual: template dengan kosong [nama]/[detail_hidup]/[niche] terisi
 *   otomatis dari form; user bebas mengolah lalu menyalin.
 * - AI: konten dibuat lewat /api/generate yang sudah ada (persona bernama +
 *   kerangka "cerita", tanpa link) lalu bisa diedit sebelum disalin.
 *
 * Semua hasil tersimpan otomatis di localStorage (per browser).
 */

import { useState } from "react";
import { Card } from "@/components/card";
import {
  DATA_BRANDING_AWAL,
  HARI_KIT,
  KUNCI_BRANDING,
  KUNCI_BRANDING_HASIL,
  bodyAI,
  isiTemplate,
  type DataBranding,
} from "@/lib/branding/kit";
import { useLocalState } from "@/lib/konten/use-local-state";
import { salinKeClipboard } from "@/lib/konten/salin";
import { postJson } from "@/features/posting/draft-posting";

const fieldClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
const labelClass = "mb-1 block text-badan font-medium";

interface HasilHari {
  mode: "manual" | "ai";
  teks: string;
  /** True = teks sudah disunting user / berasal dari AI, jangan ditimpa template. */
  diubah: boolean;
}

type HasilPerHari = Record<number, HasilHari>;

const BATAS_THREADS = 500;

export function BrandingKit() {
  const [data, setData] = useLocalState<DataBranding>(KUNCI_BRANDING, DATA_BRANDING_AWAL);
  const [hasil, setHasil] = useLocalState<HasilPerHari>(KUNCI_BRANDING_HASIL, {});
  const [memproses, setMemproses] = useState<number | null>(null);
  const [pesan, setPesan] = useState<Record<number, string>>({});
  const [tersalin, setTersalin] = useState<number | null>(null);

  const teksHari = (id: number, template: string): string => {
    const h = hasil[id];
    if (h?.diubah) return h.teks;
    return isiTemplate(template, data);
  };

  const ubahTeks = (id: number, mode: HasilHari["mode"], teks: string) => {
    setHasil((prev) => ({ ...prev, [id]: { mode, teks, diubah: true } }));
  };

  const pilihMode = (id: number, mode: HasilHari["mode"]) => {
    setHasil((prev) => {
      const lama = prev[id];
      if (lama?.mode === mode) return prev;
      // Ganti mode = kembali ke template manual (teks AI tidak dibuang selama
      // belum ada yang menimpa; user bisa tekan "Kembalikan" bila menyesal).
      if (mode === "manual") {
        return { ...prev, [id]: { mode, teks: "", diubah: false } };
      }
      return { ...prev, [id]: { mode, teks: lama?.teks ?? "", diubah: lama?.diubah ?? false } };
    });
  };

  const kembalikanTemplate = (id: number) => {
    setHasil((prev) => ({ ...prev, [id]: { mode: "manual", teks: "", diubah: false } }));
  };

  const buatDenganAi = async (id: number) => {
    const hari = HARI_KIT.find((h) => h.id === id);
    if (!hari || memproses !== null) return;
    setMemproses(id);
    setPesan((prev) => ({ ...prev, [id]: "" }));
    try {
      const hasilAi = await postJson<{ statuses: string[] }>(
        "/api/generate",
        bodyAI(data, hari),
      );
      const status = hasilAi.data?.statuses?.[0]?.trim();
      if (hasilAi.ok && status) {
        setHasil((prev) => ({ ...prev, [id]: { mode: "ai", teks: status, diubah: true } }));
      } else {
        setPesan((prev) => ({
          ...prev,
          [id]: hasilAi.error || "Gagal membuat. Cek provider AI di Pengaturan, lalu coba lagi.",
        }));
      }
    } catch {
      setPesan((prev) => ({
        ...prev,
        [id]: "Koneksi bermasalah. Coba lagi sebentar.",
      }));
    } finally {
      setMemproses(null);
    }
  };

  const salin = async (id: number, teks: string) => {
    const ok = await salinKeClipboard(teks);
    if (ok) {
      setTersalin(id);
      window.setTimeout(() => setTersalin(null), 2000);
    }
  };

  const formKosong = !data.detailHidup.trim() || !data.niche.trim();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <h1 className="text-judul font-semibold">Branding Kit — 7 Hari Personal Branding</h1>
        <p className="mt-2 text-badan text-muted-foreground">
          Tujuh postingan pembuka untuk akun baru: Hari 1-7 <strong>tanpa link dan tanpa
          jualan</strong>. Tujuannya satu — bikin orang kenal dan percaya sama akunmu sebelum
          ada produk dibahas. Cocok dijalankan bersama Rencana Perdana.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="bk-nama">
              Nama persona
            </label>
            <input
              id="bk-nama"
              value={data.nama}
              onChange={(e) => setData({ ...data, nama: e.target.value })}
              className={fieldClass}
              placeholder="Pak Slem"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="bk-detail">
              Satu keseharian nyata (untuk bahan cerita)
            </label>
            <input
              id="bk-detail"
              value={data.detailHidup}
              onChange={(e) => setData({ ...data, detailHidup: e.target.value })}
              className={fieldClass}
              placeholder="kandang ayam di belakang rumah"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="bk-niche">
              Topik pagar akun (niche)
            </label>
            <input
              id="bk-niche"
              value={data.niche}
              onChange={(e) => setData({ ...data, niche: e.target.value })}
              className={fieldClass}
              placeholder="barang praktis rumah tangga"
            />
          </div>
        </div>
        <p className="mt-2 text-meta text-muted-foreground">
          Isi form sekali — semua kosong [detail_hidup] dan [niche] di bawah terisi otomatis.
          Semua tersimpan otomatis di browser ini.
        </p>
        {formKosong ? (
          <p className="mt-2 text-meta font-medium text-amber-600 dark:text-amber-400">
            Isi dulu keseharian dan topik di atas supaya template tidak menampilkan kosong [...]
          </p>
        ) : null}
      </Card>

      {HARI_KIT.map((hari) => {
        const h = hasil[hari.id];
        const mode = h?.mode ?? "manual";
        const teks = teksHari(hari.id, hari.template);
        const lebih = teks.length > BATAS_THREADS;
        return (
          <Card key={hari.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-meta font-semibold text-primary">
                Hari {hari.id}
              </span>
              <h2 className="text-badan font-semibold">{hari.judul}</h2>
              {hari.hariIstirahat ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-meta text-muted-foreground">
                  tidak posting
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-meta text-muted-foreground">{isiTemplate(hari.tugas, data)}</p>

            <div className="mt-3 flex gap-2" role="group" aria-label={`Cara isi hari ${hari.id}`}>
              <button
                type="button"
                aria-pressed={mode === "manual"}
                onClick={() => pilihMode(hari.id, "manual")}
                className={
                  "h-10 flex-1 rounded-md border-2 px-3 text-badan font-medium " +
                  (mode === "manual"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-surface-border text-muted-foreground hover:bg-muted/50")
                }
              >
                ✍️ Tulis sendiri (template)
              </button>
              <button
                type="button"
                aria-pressed={mode === "ai"}
                onClick={() => pilihMode(hari.id, "ai")}
                className={
                  "h-10 flex-1 rounded-md border-2 px-3 text-badan font-medium " +
                  (mode === "ai"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-surface-border text-muted-foreground hover:bg-muted/50")
                }
              >
                ✨ Buat dengan AI
              </button>
            </div>

            <textarea
              value={teks}
              onChange={(e) => ubahTeks(hari.id, mode, e.target.value)}
              rows={9}
              className={`${fieldClass} mt-3 resize-y leading-relaxed`}
              aria-label={`Teks hari ${hari.id}`}
            />
            <p
              className={`mt-1 text-meta ${lebih ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
            >
              {teks.length}/{BATAS_THREADS} karakter {lebih ? "— kurangi sebelum posting" : ""}
            </p>

            {pesan[hari.id] ? (
              <p className="mt-1 text-meta font-medium text-red-600 dark:text-red-400">
                {pesan[hari.id]}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => salin(hari.id, teks)}
                className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-badan font-medium text-primary-foreground hover:opacity-90"
              >
                {tersalin === hari.id ? "✓ Tersalin" : "Salin"}
              </button>
              {mode === "ai" ? (
                <button
                  type="button"
                  onClick={() => buatDenganAi(hari.id)}
                  disabled={memproses !== null}
                  className="inline-flex h-10 items-center rounded-md border-2 border-primary/40 bg-primary/5 px-4 text-badan font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  {memproses === hari.id ? "Menulis…" : h?.diubah ? "Buat ulang" : "Buat dengan AI"}
                </button>
              ) : null}
              {h?.diubah ? (
                <button
                  type="button"
                  onClick={() => kembalikanTemplate(hari.id)}
                  className="inline-flex h-10 items-center rounded-md px-3 text-meta text-muted-foreground hover:text-foreground"
                >
                  Kembalikan ke template
                </button>
              ) : null}
            </div>
            {mode === "ai" && !h?.diubah ? (
              <p className="mt-1 text-meta text-muted-foreground">
                Tekan &quot;Buat dengan AI&quot; — hasilnya gaya cerita Pak-bapak, tanpa link,
                dan bisa kamu sunting di kotak atas.
              </p>
            ) : null}
          </Card>
        );
      })}

      <Card>
        <h2 className="text-badan font-semibold">Selesai 7 hari? Lanjut ke produk.</h2>
        <p className="mt-1 text-badan text-muted-foreground">
          Minggu kedua mulai bahas produk lewat menu Riset — persona dan kebiasaan jujur dari
          minggu pertama inilah modalnya.
        </p>
      </Card>
    </div>
  );
}
