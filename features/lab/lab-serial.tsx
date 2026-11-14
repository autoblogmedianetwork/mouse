"use client";

/**
 * Serial konten halaman Lab (refactor R6). Dipindah utuh dari
 * lab-klien.tsx — tidak ada perubahan perilaku.
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { type Serial7, type Serial30 } from "@/lib/ai/schemas";
import { bangkitkanHashtag } from "@/lib/konten/hashtag";
import { cn } from "@/lib/utils";
import { inputClass, btnPrimary, btnGhost, TombolSalin, PesanGalat, panggilAI } from "./lab-bersama";


/* ---- Serial ---- */

export function BagianSerial() {
  const [namaProduk, setNamaProduk] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [masalah, setMasalah] = useState("");
  const [hasil, setHasil] = useState<Serial7 | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");

  const jalankan = async () => {
    if (namaProduk.trim() === "" || deskripsi.trim().length < 10) {
      setGalat("Isi nama produk dan deskripsi minimal 10 karakter.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<Serial7>("/api/serial-7-hari", {
      namaProduk: namaProduk.trim(),
      deskripsi: deskripsi.trim(),
      masalah: masalah.trim() || undefined,
    });
    setMemuat(false);
    if (!res.ok || !res.data) {
      setHasil(null);
      setGalat(res.error ?? "Serial gagal disusun.");
      return;
    }
    setHasil(res.data);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">3. Serial racun 7 hari</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Satu produk jadi rangkaian 7 hari: penasaran → cerita → jujur soal kekurangan → ajakan
        halus. Fakta hanya diambil dari deskripsi yang Anda tempel.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-meta font-medium">
          Nama produk
          <input
            value={namaProduk}
            onChange={(e) => setNamaProduk(e.target.value)}
            placeholder="Botol minum 1 liter"
            className={cn(inputClass, "mt-1")}
          />
        </label>
        <label className="text-meta font-medium">
          Masalah audiens (opsional)
          <input
            value={masalah}
            onChange={(e) => setMasalah(e.target.value)}
            placeholder="sering lupa minum saat kerja"
            className={cn(inputClass, "mt-1")}
          />
        </label>
      </div>

      <label className="mt-3 block text-meta font-medium">
        Deskripsi produk (sumber fakta)
        <textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          rows={4}
          placeholder="Botol stainless dengan penutup ulir, tahan bocor, muat 1 liter."
          className={cn(inputClass, "mt-1 resize-y")}
        />
      </label>

      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menyusun 7 hari…" : "Susun serial 7 hari"}
      </button>
      <PesanGalat pesan={galat} />

      {hasil ? (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <p className="text-badan font-semibold">Tema: {hasil.tema}</p>
          <ol className="space-y-3">
            {hasil.hari.map((h) => (
              <li key={h.hari} className="border border-surface-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-meta font-semibold uppercase tracking-badge text-muted-foreground">
                      Hari {h.hari}
                    </p>
                    <p className="mt-1 text-badan font-medium">{h.judul}</p>
                  </div>
                  <TombolSalin teks={h.statuses.join("\n\n")} />
                </div>
                <p className="mt-1 text-meta text-muted-foreground">{h.tujuan}</p>
                <ul className="mt-2 space-y-2">
                  {h.statuses.map((s, i) => (
                    <li key={i} className="border-l-2 border-surface-border pl-3 text-badan">
                      {s}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </Card>
  );
}

/* --------------------------- 4. Pembangkit hashtag --------------------------- */


/* ---- Hashtag ---- */

export function BagianHashtag() {
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("");

  const hasil = useMemo(
    () => (nama.trim() === "" ? [] : bangkitkanHashtag({ nama, kategori })),
    [nama, kategori],
  );

  return (
    <Card>
      <h2 className="text-isi font-semibold">4. Pembangkit hashtag lokal</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Tanpa AI dan tanpa internet: tagar disusun dari nama produk, kategori, dan kamus lokal yang
        sudah disaring dari kata klaim berisiko.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-meta font-medium">
          Nama produk
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Tumbler Stainless 500ml"
            className={cn(inputClass, "mt-1")}
          />
        </label>
        <label className="text-meta font-medium">
          Kategori (opsional)
          <input
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            placeholder="dapur / fashion / kecantikan"
            className={cn(inputClass, "mt-1")}
          />
        </label>
      </div>

      {hasil.length > 0 ? (
        <div className="mt-4 border-t border-surface-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {hasil.map((tag) => (
              <span
                key={tag}
                className="border border-surface-border bg-muted/40 px-2 py-1 font-mono text-meta"
              >
                {tag}
              </span>
            ))}
            <TombolSalin teks={hasil.join(" ")} />
          </div>
          <p className="mt-2 text-meta text-muted-foreground">
            {hasil.length} tagar · hemat hashtag, jangan tempel semuanya di setiap status.
          </p>
        </div>
      ) : null}
    </Card>
  );
}

/* ----------------------------- Serial 30 hari ----------------------------- */


/* ---- Serial30 ---- */

export function BagianSerial30() {
  const [namaProduk, setNamaProduk] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [masalah, setMasalah] = useState("");
  const [hasil, setHasil] = useState<Serial30 | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const [buka, setBuka] = useState(false);

  const jalankan = async () => {
    if (namaProduk.trim() === "" || deskripsi.trim().length < 10) {
      setGalat("Isi nama produk dan deskripsi minimal 10 karakter.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<Serial30>("/api/serial-30-hari", {
      namaProduk: namaProduk.trim(),
      deskripsi: deskripsi.trim(),
      masalah: masalah.trim() || undefined,
    });
    setMemuat(false);
    if (!res.ok || !res.data) {
      setHasil(null);
      setGalat(res.error ?? "Serial gagal disusun.");
      return;
    }
    setHasil(res.data);
    setBuka(true);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">3b. Serial racun 30 hari</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Satu produk jadi rangkaian 30 hari: penasaran → cerita → jujur → tips → FAQ → ajakan halus.
        Fakta hanya diambil dari deskripsi yang Anda tempel. Keluaran besar; simpan hasilnya.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-meta font-medium">
          Nama produk
          <input
            value={namaProduk}
            onChange={(e) => setNamaProduk(e.target.value)}
            placeholder="Botol minum 1 liter"
            className={cn(inputClass, "mt-1")}
          />
        </label>
        <label className="text-meta font-medium">
          Masalah audiens (opsional)
          <input
            value={masalah}
            onChange={(e) => setMasalah(e.target.value)}
            placeholder="sering lupa minum saat kerja"
            className={cn(inputClass, "mt-1")}
          />
        </label>
      </div>

      <label className="mt-3 block text-meta font-medium">
        Deskripsi produk (sumber fakta)
        <textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          rows={4}
          placeholder="Botol stainless dengan penutup ulir, tahan bocor, muat 1 liter."
          className={cn(inputClass, "mt-1 resize-y")}
        />
      </label>

      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menyusun 30 hari…" : "Susun serial 30 hari"}
      </button>
      <PesanGalat pesan={galat} />

      {hasil ? (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <p className="text-badan font-semibold">Tema: {hasil.tema}</p>
          <button
            type="button"
            onClick={() => setBuka((v) => !v)}
            className={btnGhost}
          >
            {buka ? "Sembunyikan 30 hari" : "Tampilkan 30 hari"}
          </button>
          {buka ? (
            <ol className="space-y-3">
              {hasil.hari.map((h) => (
                <li key={h.hari} className="border border-surface-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-meta font-semibold uppercase tracking-badge text-muted-foreground">
                        Hari {h.hari}
                      </p>
                      <p className="mt-1 text-badan font-medium">{h.judul}</p>
                    </div>
                    <TombolSalin teks={h.statuses.join("\n\n")} />
                  </div>
                  <p className="mt-1 text-meta text-muted-foreground">{h.tujuan}</p>
                  <ul className="mt-2 space-y-2">
                    {h.statuses.map((s, i) => (
                      <li key={i} className="border-l-2 border-surface-border pl-3 text-badan">
                        {s}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
