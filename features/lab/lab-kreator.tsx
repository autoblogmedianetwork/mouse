"use client";

/**
 * Kreator AI halaman Lab (refactor R6). Dipindah utuh dari
 * lab-klien.tsx — tidak ada perubahan perilaku.
 */
import { useState } from "react";
import { Card } from "@/components/card";
import { type Ghostwriter, type Battle, type Jujur, type Paralel } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";
import { inputClass, btnPrimary, btnGhost, TombolSalin, PesanGalat, panggilAI } from "./lab-bersama";


/* ---- Ghostwriter ---- */

export function BagianGhostwriter() {
  const [transcript, setTranscript] = useState("");
  const [jumlah, setJumlah] = useState<"pendek" | "menengah" | "panjang">("menengah");
  const [hasil, setHasil] = useState<Ghostwriter | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const [buka, setBuka] = useState(false);

  const jalankan = async () => {
    if (transcript.trim().length < 20) {
      setGalat("Transkrip minimal 20 karakter.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<Ghostwriter>("/api/ghostwriter", {
      transcript: transcript.trim(),
      jumlah,
    });
    setMemuat(false);
    if (!res.ok || !res.data) {
      setHasil(null);
      setGalat(res.error ?? "Ghostwriter gagal.");
      return;
    }
    setHasil(res.data);
    setBuka(true);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">3c. Ghostwriter dari transkrip</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Ubah curhatan/transkrip mentah menjadi beberapa status Threads. Fakta hanya dari transkrip.
      </p>
      <label className="mt-3 block text-meta font-medium">
        Transkrip
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={5}
          placeholder="Hari ini aku nyoba botol minum baru..."
          className={cn(inputClass, "mt-1 resize-y")}
        />
      </label>
      <label className="mt-3 block text-meta font-medium">
        Jumlah status
        <select
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value as "pendek" | "menengah" | "panjang")}
          className={cn(inputClass, "mt-1")}
        >
          <option value="pendek">Pendek (3)</option>
          <option value="menengah">Menengah (4)</option>
          <option value="panjang">Panjang (5)</option>
        </select>
      </label>
      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menulis…" : "Buat status dari transkrip"}
      </button>
      <PesanGalat pesan={galat} />
      {hasil ? (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <p className="text-badan font-semibold">Tema: {hasil.tema}</p>
          <button type="button" onClick={() => setBuka((v) => !v)} className={btnGhost}>
            {buka ? "Sembunyikan" : "Tampilkan"}
          </button>
          {buka ? (
            <ol className="space-y-2">
              {hasil.statuses.map((s, i) => (
                <li key={i} className="border border-surface-border p-3 text-badan">
                  <TombolSalin teks={s} />
                  <p className="mt-1">{s}</p>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}


/* ---- Battle ---- */

export function BagianBattle() {
  const [produk, setProduk] = useState<{ nama: string; deskripsi: string }[]>([
    { nama: "", deskripsi: "" },
    { nama: "", deskripsi: "" },
  ]);
  const [hasil, setHasil] = useState<Battle | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const [buka, setBuka] = useState(false);

  const tambahProduk = () => {
    if (produk.length >= 4) return;
    setProduk((p) => [...p, { nama: "", deskripsi: "" }]);
  };
  const hapusProduk = (idx: number) => {
    if (produk.length <= 2) return;
    setProduk((p) => p.filter((_, i) => i !== idx));
  };
  const ubah = (idx: number, key: "nama" | "deskripsi", val: string) => {
    setProduk((p) => p.map((item, i) => (i === idx ? { ...item, [key]: val } : item)));
  };

  const jalankan = async () => {
    const bersih = produk.filter((p) => p.nama.trim() && p.deskripsi.trim().length >= 10);
    if (bersih.length < 2) {
      setGalat("Isi minimal 2 produk (nama + deskripsi min 10 karakter).");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<Battle>("/api/battle", { produk: bersih });
    setMemuat(false);
    if (!res.ok || !res.data) {
      setHasil(null);
      setGalat(res.error ?? "Battle gagal.");
      return;
    }
    setHasil(res.data);
    setBuka(true);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">3d. Roulette/battle gabungan produk</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Bandingkan 2-4 produk secara jujur; hasil draft, bukan rekomendasi mutlak.
      </p>
      <div className="mt-4 space-y-3">
        {produk.map((p, idx) => (
          <div key={idx} className="border border-surface-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-meta font-semibold">Produk {idx + 1}</p>
              {produk.length > 2 ? (
                <button type="button" onClick={() => hapusProduk(idx)} className={btnGhost}>
                  Hapus
                </button>
              ) : null}
            </div>
            <input
              value={p.nama}
              onChange={(e) => ubah(idx, "nama", e.target.value)}
              placeholder="Nama produk"
              className={cn(inputClass, "mt-2")}
            />
            <textarea
              value={p.deskripsi}
              onChange={(e) => ubah(idx, "deskripsi", e.target.value)}
              rows={3}
              placeholder="Deskripsi produk"
              className={cn(inputClass, "mt-2 resize-y")}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={tambahProduk} disabled={produk.length >= 4} className={btnGhost}>
          + Tambah produk
        </button>
        <button type="button" onClick={() => void jalankan()} disabled={memuat} className={btnPrimary}>
          {memuat ? "Menyusun…" : "Susun battle"}
        </button>
      </div>
      <PesanGalat pesan={galat} />
      {hasil ? (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <p className="text-badan font-semibold">Tema: {hasil.tema}</p>
          <button type="button" onClick={() => setBuka((v) => !v)} className={btnGhost}>
            {buka ? "Sembunyikan" : "Tampilkan"}
          </button>
          {buka ? (
            <ol className="space-y-2">
              {hasil.statuses.map((s, i) => (
                <li key={i} className="border border-surface-border p-3 text-badan">
                  <TombolSalin teks={s} />
                  <p className="mt-1">{s}</p>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}


/* ---- Jujur ---- */

export function BagianJujur() {
  const [teks, setTeks] = useState("");
  const [hasil, setHasil] = useState<Jujur | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const jalankan = async () => {
    if (teks.trim().length < 10) {
      setGalat("Teks minimal 10 karakter.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<Jujur>("/api/kembaran-jujur", { teks: teks.trim() });
    setMemuat(false);
    if (!res.ok || !res.data) {
      setHasil(null);
      setGalat(res.error ?? "Gagal.");
      return;
    }
    setHasil(res.data);
  };
  return (
    <Card>
      <h2 className="text-isi font-semibold">3e. AI kembaran jujur</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Tulis ulang satu status jadi versi lebih jujur/transparan (tanpa hype).
      </p>
      <textarea
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        rows={4}
        placeholder="Status asli…"
        className={cn(inputClass, "mt-3 resize-y")}
      />
      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menulis…" : "Buat versi jujur"}
      </button>
      <PesanGalat pesan={galat} />
      {hasil ? (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <p className="text-badan font-semibold">Versi jujur:</p>
          <p className="text-badan">{hasil.versi_jujur}</p>
          <TombolSalin teks={hasil.versi_jujur} />
          <p className="text-meta text-muted-foreground">Catatan: {hasil.catatan}</p>
        </div>
      ) : null}
    </Card>
  );
}


/* ---- Paralel ---- */

export function BagianParalel() {
  const [teks, setTeks] = useState("");
  const [genre, setGenre] = useState("sci-fi");
  const [hasil, setHasil] = useState<Paralel | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const jalankan = async () => {
    if (teks.trim().length < 10) {
      setGalat("Teks minimal 10 karakter.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<Paralel>("/api/paralel", { teks: teks.trim(), genre: genre.trim() || "sci-fi" });
    setMemuat(false);
    if (!res.ok || !res.data) {
      setHasil(null);
      setGalat(res.error ?? "Gagal.");
      return;
    }
    setHasil(res.data);
  };
  return (
    <Card>
      <h2 className="text-isi font-semibold">3f. Mode paralel universe</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Tulis ulang status ke genre/sudut pandang lain, fakta tetap.
      </p>
      <textarea
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        rows={4}
        placeholder="Status asli…"
        className={cn(inputClass, "mt-3 resize-y")}
      />
      <input
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        placeholder="genre, mis. sci-fi, fantasi, komedi"
        className={cn(inputClass, "mt-2")}
      />
      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menulis…" : "Buat versi paralel"}
      </button>
      <PesanGalat pesan={galat} />
      {hasil ? (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <p className="text-badan font-semibold">Genre: {hasil.genre}</p>
          <p className="text-badan">{hasil.versi_paralel}</p>
          <TombolSalin teks={hasil.versi_paralel} />
        </div>
      ) : null}
    </Card>
  );
}
