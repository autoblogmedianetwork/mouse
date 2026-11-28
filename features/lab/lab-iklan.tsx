"use client";

/**
 * Lab Iklan — pembuat iklan Meta dan landing page.
 *
 * Alur:
 * 1. Kalkulator → hitung break-even dari komisi, cpc, budget.
 * 2. Generator Iklan → buat 3 varian iklan Meta via AI (pakai prompt ad-iklan-meta).
 * 3. Wizard Landing Page → susun halaman landing sederhana untuk menampung traffic iklan.
 *
 * Semua keluaran berstatus draft. Tidak ada yang otomatis dipublikasikan.
 */
import { useState } from "react";
import { Card } from "@/components/card";
import { cn } from "@/lib/utils";
import { inputClass, btnPrimary, btnGhost, TombolSalin, PesanGalat, panggilAI } from "./lab-bersama";
import { type IklanParams, type IklanResult, estimateIklan } from "@/lib/advertising/iklan-calculator";

/* ------------------------------------------------------------------ kalkulator -- */

export function BagianKalkulator() {
  const [params, setParams] = useState<IklanParams>({ commission: 5, cpc: 2000, budget: 200000 });
  const [hasil, setHasil] = useState<IklanResult | null>(null);
  const [galat, setGalat] = useState("");

  const hitung = () => {
    try {
      setHasil(estimateIklan(params));
      setGalat("");
    } catch (e) {
      setHasil(null);
      setGalat(e instanceof Error ? e.message : "Hitung gagal.");
    }
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">📊 Kalkulator Break-Even Iklan</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Masukkan persentase komisi affiliate, estimasi cost-per-click di Meta Ads, dan budget
        harian. Alat ini memperkirakan berapa penjualan yang dibutuhkan agar tidak rugi.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block text-meta font-medium">
          Komisi (%) (rata-rata Shopee Affiliate)
          <input
            type="number"
            min={0.1}
            max={100}
            step={0.1}
            value={params.commission}
            onChange={(e) => setParams((p) => ({ ...p, commission: Number(e.target.value) || 0 }))}
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <label className="block text-meta font-medium">
          CPC (Rupiah)
          <input
            type="number"
            min={100}
            step={100}
            value={params.cpc}
            onChange={(e) => setParams((p) => ({ ...p, cpc: Number(e.target.value) || 0 }))}
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <label className="block text-meta font-medium">
          Budget Harian (Rupiah)
          <input
            type="number"
            min={1000}
            step={1000}
            value={params.budget}
            onChange={(e) => setParams((p) => ({ ...p, budget: Number(e.target.value) || 0 }))}
            className={cn(inputClass, "mt-1")}
          />
        </label>
      </div>

      <button type="button" onClick={hitung} disabled={!params.commission || !params.cpc || !params.budget} className={cn(btnPrimary, "mt-4")}>
        Hitung Break-Even
      </button>
      <PesanGalat pesan={galat} />

      {hasil && (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-surface-border p-3">
              <p className="text-meta text-xs uppercase tracking-badge text-muted-foreground">Penjualan Dibutuhkan</p>
              <p className="mt-1 text-isi font-bold">{hasil.salesNeeded}</p>
              <p className="text-meta text-xs text-muted-foreground">minimal per siklus budget</p>
            </div>
            <div className="border border-surface-border p-3">
              <p className="text-meta text-xs uppercase tracking-badge text-muted-foreground">Klik Diperlukan</p>
              <p className="mt-1 text-isi font-bold">{hasil.clicksNeeded.toLocaleString("id-ID")}</p>
              <p className="text-meta text-xs text-muted-foreground">dengan asumsi konversi {Math.round(hasil.salesNeeded / hasil.clicksNeeded * 100)}%</p>
            </div>
            <div className="border border-surface-border p-3">
              <p className="text-meta text-xs uppercase tracking-badge text-muted-foreground">Biaya per Penjualan</p>
              <p className="mt-1 text-isi font-bold">Rp{Math.round(hasil.costPerSale).toLocaleString("id-ID")}</p>
              <p className="text-meta text-xs text-muted-foreground">harus di bawah margin keuntungan</p>
            </div>
          </div>

          <div className="rounded bg-status-failed/10 p-3 text-meta">
            <p className="font-medium">⚠️ Aturan Shopee Affiliate:</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Iklan berbayar diizinkan hanya untuk social media (FB/IG/TikTok/Pinterest) dari akun terdaftar.</li>
              <li>JANGAN gunakan kata &ldquo;Shopee&rdquo; di kreatif atau keyword.</li>
              <li>Wajib beri disclosure (#publi / #ad).</li>
              <li>Komisi hangus jika terdeteksi sebagai sumber tidak terlacak.</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------- generator iklan Meta -- */

export interface VarianIklan {
  judul: string;
  isi: string;
  cta: string;
}

export function GeneratorIklanMeta() {
  const [produk, setProduk] = useState("");
  const [harga, setHarga] = useState("");
  const [komisi, setKomisi] = useState("5");
  const [varian, setVarian] = useState<VarianIklan[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");

  const generate = async () => {
    const produkBersih = produk.trim();
    if (!produkBersih || produkBersih.length < 3) {
      setGalat("Isi nama atau deskripsi produk minimal 3 karakter.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<{ varian: VarianIklan[] }>("/api/marketing/iklan-meta", {
      produk: produkBersih,
      harga: harga.trim() || undefined,
      komisiPersen: parseFloat(komisi) || 5,
    });
    setMemuat(false);
    if (!res.ok || !res.data?.varian) {
      setVarian([]);
      setGalat(res.error ?? "Generate iklan gagal.");
      return;
    }
    setVarian(res.data.varian);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">📝 Generator Iklan Meta</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        AI membuat 3 varian iklan Meta (headline, primary text, CTA) dalam gaya Pak Slem: santai,
        memancing, anti-clickbait, dengan kepatuhan aturan Shopee Affiliate. Copy manual ke Ads
        Manager — Heaviliate tidak mengirim iklan secara otomatis.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="sm:col-span-2 block text-meta font-medium">
          Nama / deskripsi produk
          <input
            value={produk}
            onChange={(e) => setProduk(e.target.value)}
            placeholder="Tumbler stainless 750ml, lidah stroberi"
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <label className="block text-meta font-medium">
          Harga jual (opsional)
          <input
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
            placeholder="185000"
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <label className="block text-meta font-medium">
          Komisi affiliate (%)
          <input
            type="number"
            min={1}
            max={100}
            value={komisi}
            onChange={(e) => setKomisi(e.target.value)}
            className={cn(inputClass, "mt-1")}
          />
        </label>
      </div>

      <button type="button" onClick={generate} disabled={memuat} className={cn(btnPrimary, "mt-4")}>
        {memuat ? "Menulis…" : "Buat 3 Varian Iklan"}
      </button>
      <PesanGalat pesan={galat} />

      {varian.length > 0 && (
        <div className="mt-4 space-y-4 border-t border-surface-border pt-4">
          <p className="text-meta font-medium">3 varian iklan siap copas ke Meta Ads Manager:</p>
          {varian.map((v, i) => (
            <div key={i} className="rounded-lg border border-surface-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-isi font-semibold">Varian {i + 1}</p>
                <div className="flex gap-2">
                  <TombolSalin teks={`${v.judul}\n${v.isi}\nCTA: ${v.cta}`} />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <span className="text-meta text-xs uppercase tracking-badge text-muted-foreground">Headline</span>
                  <p className="mt-1 text-badan">{v.judul}</p>
                </div>
                <div>
                  <span className="text-meta text-xs uppercase tracking-badge text-muted-foreground">Primary Text</span>
                  <p className="mt-1 whitespace-pre-wrap text-badan">{v.isi}</p>
                </div>
                <div>
                  <span className="text-meta text-xs uppercase tracking-badge text-muted-foreground">CTA Button</span>
                  <p className="mt-1 text-badan font-medium">{v.cta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------ wizard landing page -- */

interface DataLandingPage {
  slug: string;
  hero: string;
  judul: string;
  subjudul: string;
  cta: string;
  deskripsi: string;
  tautan: string;
}

export function WizardLandingPage() {
  const [data, setData] = useState<DataLandingPage>({
    slug: "",
    hero: "",
    judul: "",
    subjudul: "",
    cta: "Cek Produknya",
    deskripsi: "",
    tautan: "",
  });
  const [pratinjau, setPratinjau] = useState<DataLandingPage | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const [hasilLanding, setHasilLanding] = useState<
    { slug: string; url: string; tersimpan: boolean; html: string } | null
  >(null);

  const preview = () => {
    setPratinjau({ ...data });
    setHasilLanding(null);
  };

  const buat = async () => {
    const slugBersih = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    if (!slugBersih || slugBersih.length < 2) {
      setGalat("Slug harus berisi huruf/huruf angka (contoh: tumbler-stroberi).");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<{
      success: boolean;
      url: string;
      tersimpan: boolean;
      html: string;
    }>("/api/marketing/landing-page", {
      ...data,
      slug: slugBersih,
    });
    setMemuat(false);
    if (!res.ok || !res.data?.success) {
      setHasilLanding(null);
      setGalat(res.error ?? "Buat landing page gagal.");
      return;
    }
    setHasilLanding({
      slug: slugBersih,
      url: res.data.url,
      tersimpan: res.data.tersimpan,
      html: res.data.html,
    });
    setPratinjau(data);
  };

  const unduh = () => {
    if (!hasilLanding) return;
    const blob = new Blob([hasilLanding.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${hasilLanding.slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">🌐 Wizard Landing Page</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Susun satu halaman landing cepat untuk menampung traffic iklan Meta. Halaman dibuat sebagai
        file statis, bisa dipakai sebagai tujuan link bio atau direct destination URL di iklan.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-meta font-medium">
            Slug (URL)
            <input
              value={data.slug}
              onChange={(e) => setData((d) => ({ ...d, slug: e.target.value }))}
              placeholder="tumbler-stroberi"
              className={cn(inputClass, "mt-1")}
            />
          </label>

          <label className="block text-meta font-medium">
            Judul utama (headline)
            <input
              value={data.judul}
              onChange={(e) => setData((d) => ({ ...d, judul: e.target.value }))}
              placeholder="Pagi hari makin rapi dengan tumbler ini"
              className={cn(inputClass, "mt-1")}
            />
          </label>

          <label className="block text-meta font-medium">
            Sub-judul
            <input
              value={data.subjudul}
              onChange={(e) => setData((d) => ({ ...d, subjudul: e.target.value }))}
              placeholder="Stainless steel 750ml, tahan panas 12 jam"
              className={cn(inputClass, "mt-1")}
            />
          </label>

          <label className="block text-meta font-medium">
            Deskripsi panjang
            <textarea
              value={data.deskripsi}
              onChange={(e) => setData((d) => ({ ...d, deskripsi: e.target.value }))}
              rows={4}
              placeholder="Cerita singkat kenapa produk ini worth it..."
              className={cn(inputClass, "mt-1 resize-y")}
            />
          </label>

          <label className="block text-meta font-medium">
            Tautan afiliasi (tujuan tombol)
            <input
              value={data.tautan}
              onChange={(e) => setData((d) => ({ ...d, tautan: e.target.value }))}
              placeholder="https://s.shopee.co.id/..."
              className={cn(inputClass, "mt-1")}
            />
          </label>

          <label className="block text-meta font-medium">
            Teks CTA tombol
            <input
              value={data.cta}
              onChange={(e) => setData((d) => ({ ...d, cta: e.target.value }))}
              placeholder="Cek Produknya"
              className={cn(inputClass, "mt-1")}
            />
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={preview} className={btnGhost}>
              Pratinjau
            </button>
            <button type="button" onClick={buat} disabled={memuat} className={btnPrimary}>
              {memuat ? "Membuat…" : "Buat Halaman"}
            </button>
          </div>
          <PesanGalat pesan={galat} />
          <p className="text-meta text-muted-foreground">
            Halaman ditulis sebagai file statis di folder <code>public/landing</code>. Saat
            dijalankan di server sendiri (atau lokal), file bisa langsung dibuka. Di hosting yang
            read-only (mis. Vercel), file perlu diunduh lalu di-host sendiri — salin HTML-nya dari
            lokasi tersebut.
          </p>
        </div>

        {/* Preview */}
        <div className="rounded border border-surface-border bg-muted p-4">
          <p className="mb-2 text-meta font-medium">Pratinjau Landing Page</p>
          {pratinjau ? (
            <article className="space-y-3">
              {pratinjau.hero && (
                <div className="aspect-video w-full rounded bg-muted-foreground/20" />
              )}
              <h3 className="text-isi font-bold">{pratinjau.judul || "(kosong)"}</h3>
              <p className="text-meta text-muted-foreground">{pratinjau.subjudul || ""}</p>
              <p className="text-badan whitespace-pre-wrap">{pratinjau.deskripsi || ""}</p>
              <button className={cn(btnPrimary, "mt-2")}>{pratinjau.cta}</button>
              {pratinjau.tautan && (
                <p className="text-meta break-all text-muted-foreground">
                  Tombol mengarah ke: {pratinjau.tautan}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">#publi</p>
            </article>
          ) : (
            <p className="text-meta text-muted-foreground">Klik pratinjau atau buat halaman untuk melihat hasilnya di sini.</p>
          )}
        </div>
      </div>

      {hasilLanding ? (
        <div className="mt-4 rounded bg-green-500/10 p-3 text-meta text-green-700 dark:text-green-400">
          {hasilLanding.tersimpan ? (
            <>
              ✅ Halaman dibuat. URL tujuan:{" "}
              <code className="font-mono text-badan text-sm">/{hasilLanding.slug}</code> — salin
              URL ini sebagai target di Meta Ads atau masukkan ke link bio.
            </>
          ) : (
            <div className="space-y-2">
              <p>
                ✅ Halaman dibuat, tapi server ini read-only (mis. Vercel) sehingga file tidak bisa
                ditulis. Unduh HTML-nya lalu hosting sendiri.
              </p>
              <button type="button" onClick={unduh} className={btnPrimary}>
                Unduh {hasilLanding.slug}.html
              </button>
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------------ orkestrator -- */

export function BagianLabIklan() {
  return (
    <div id="lab-iklan" className="scroll-mt-24 space-y-6">
      <p className="text-meta text-muted-foreground">
        Fitur beriklanan — kalkulator break-even, generator iklan Meta, dan wizard landing page.
        Semua keluaran berstatus draft dan dikirim manual oleh Anda. Heaviliate tidak mengontrol
        akun iklan atau menerbitkan konten tanpa persetujuan Anda.
      </p>
      <BagianKalkulator />
      <GeneratorIklanMeta />
      <WizardLandingPage />
    </div>
  );
}
