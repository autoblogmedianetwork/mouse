"use client";

/**
 * HalamanBio — ekspor halaman bio-link dari Katalog (riset 17 Nov).
 *
 * Bio Threads hanya muat satu link; halaman ini memuat semuanya. Hasilnya
 * satu berkas .html mandiri yang diunduh ke perangkat user — meng-hosting
 * dan membagikan adalah tindakan user, bukan aplikasi (Fase 4).
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { muatProduk } from "@/lib/produk/store";
import { susunHalamanBio, type HasilBio } from "@/lib/bio/generator";

const tombol =
  "inline-flex h-11 sm:h-9 items-center border border-surface-border px-3 text-meta font-medium hover:bg-muted disabled:opacity-40";
const inputCls =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
const labelCls = "mb-1 block text-meta font-mono uppercase tracking-meta text-muted-foreground";

export function HalamanBio() {
  const [nama, setNama] = useState("");
  const [tagline, setTagline] = useState("");
  const [pesan, setPesan] = useState<string | null>(null);

  const produk = useMemo(() => muatProduk(), []);
  const hasil: HasilBio = useMemo(
    () =>
      susunHalamanBio({
        nama,
        tagline,
        produk: produk.map((p) => ({
          nama: p.nama_internal ?? p.nama ?? "Tanpa nama",
          harga: p.harga,
          url: p.url_referensi,
        })),
      }),
    [nama, tagline, produk],
  );

  const unduh = () => {
    if (!hasil.ok) return;
    const blob = new Blob([hasil.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bio-link.html";
    a.click();
    URL.revokeObjectURL(url);
    setPesan(`bio-link.html diunduh (${hasil.jumlahLink} link). Unggah ke hosting statis pilihanmu.`);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">Halaman bio-link dari Katalog</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Bio Threads hanya muat satu link — halaman ini memuat semuanya. Satu berkas HTML
        mandiri: unggah ke hosting statis (GitHub Pages, Netlify, Cloudflare Pages), lalu
        pasang alamatnya di bio. Tanpa akun layanan pihak ketiga.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bio-nama" className={labelCls}>
            Nama di halaman
          </label>
          <input
            id="bio-nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Pak Slem"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="bio-tagline" className={labelCls}>
            Tagline (opsional)
          </label>
          <input
            id="bio-tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Review jujur barang dapur"
            className={inputCls}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className={tombol} onClick={unduh} disabled={!hasil.ok}>
          Unduh bio-link.html
        </button>
        <p className="text-meta text-muted-foreground">
          {hasil.ok
            ? `${hasil.jumlahLink} link dari Katalog siap diekspor.`
            : "Lengkapi nama, dan pastikan produk di Katalog punya URL."}
        </p>
      </div>

      {!hasil.ok && hasil.galat ? (
        <p role="alert" className="mt-3 border border-status-failed/50 bg-status-failed/10 px-3 py-2 text-badan text-status-failed">
          {hasil.galat}
        </p>
      ) : null}
      {pesan ? (
        <p role="status" className="mt-3 text-meta text-status-ready">
          {pesan}
        </p>
      ) : null}
    </Card>
  );
}
