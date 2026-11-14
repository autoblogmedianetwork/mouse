"use client";

/**
 * Alat lain halaman Lab (refactor R6). Dipindah utuh dari
 * lab-klien.tsx — tidak ada perubahan perilaku.
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/card";
import { type Nyanyian, type LawanBots, type Foto, type Mirror } from "@/lib/ai/schemas";
import { badgeUntukLevel, muatProfil, simpanProfil, tambahXp, xpKeLevelBerikutnya, type ProfilGamifikasi } from "@/lib/konten/gamifikasi";
import { buatTimeCapsule, hapusTimeCapsule, muatTimeCapsule, siapDibuka, simpanTimeCapsule, tandaiDibuka, validasiTimeCapsule, type TimeCapsule } from "@/lib/konten/time-capsule";
import { cn } from "@/lib/utils";
import { inputClass, btnPrimary, btnGhost, TombolSalin, PesanGalat, panggilAI } from "./lab-bersama";


/* ---- TimeCapsule ---- */

export function BagianTimeCapsule() {
  const [daftar, setDaftar] = useState<TimeCapsule[]>([]);
  const [siap, setSiap] = useState(false);
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [bukaPada, setBukaPada] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDaftar(muatTimeCapsule());
    setSiap(true);
  }, []);
  const simpan = () => {
    setGalat(null);
    const err = validasiTimeCapsule(judul, isi, bukaPada);
    if (err) {
      setGalat(err);
      return;
    }
    const baru = buatTimeCapsule(judul, isi, bukaPada);
    const next = [baru, ...daftar];
    setDaftar(next);
    simpanTimeCapsule(next);
    setJudul("");
    setIsi("");
    setBukaPada("");
  };
  const buka = (id: string) => {
    const next = tandaiDibuka(daftar, id);
    setDaftar(next);
    simpanTimeCapsule(next);
  };
  const hapus = (id: string) => {
    if (!window.confirm("Hapus time capsule ini?")) return;
    const next = hapusTimeCapsule(daftar, id);
    setDaftar(next);
    simpanTimeCapsule(next);
  };
  if (!siap) return null;
  return (
    <Card>
      <h2 className="text-isi font-semibold">3g. Time capsule</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Simpan draft untuk dibuka di tanggal mendatang. Penyimpanan lokal.
      </p>
      <div className="mt-3 space-y-2">
        <input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Judul" className={inputClass} />
        <textarea value={isi} onChange={(e) => setIsi(e.target.value)} rows={3} placeholder="Isi" className={cn(inputClass, "resize-y")} />
        <input type="date" value={bukaPada} onChange={(e) => setBukaPada(e.target.value)} className={inputClass} />
        {galat ? <p className="text-status-failed text-meta">{galat}</p> : null}
        <button type="button" onClick={simpan} className={btnPrimary}>Simpan capsule</button>
      </div>
      <ul className="mt-4 space-y-2">
        {daftar.map((c) => (
          <li key={c.id} className="border border-surface-border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-badan font-medium">{c.judul}</p>
                <p className="text-meta text-muted-foreground">Buka: {new Date(c.buka_pada).toLocaleDateString("id-ID")}</p>
              </div>
              <div className="flex gap-2">
                {siapDibuka(c) ? (
                  <button type="button" onClick={() => buka(c.id)} className={btnGhost}>Buka</button>
                ) : null}
                <button type="button" onClick={() => hapus(c.id)} className={btnGhost}>Hapus</button>
              </div>
            </div>
            {c.dibuka_pada ? (
              <p className="mt-2 text-badan">{c.isi}</p>
            ) : siapDibuka(c) ? (
              <p className="mt-2 text-meta text-muted-foreground">Siap dibuka.</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}


/* ---- Nyanyian ---- */

export function BagianNyanyian() {
  const [teks, setTeks] = useState("");
  const [hasil, setHasil] = useState<Nyanyian | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const jalankan = async () => {
    if (teks.trim().length < 10) {
      setGalat("Teks minimal 10 karakter.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<Nyanyian>("/api/nyanyian", { teks: teks.trim() });
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
      <h2 className="text-isi font-semibold">3h. Mode nyanyian</h2>
      <p className="mt-1 text-badan text-muted-foreground">Ubah status jadi lirik singkat.</p>
      <textarea value={teks} onChange={(e) => setTeks(e.target.value)} rows={4} placeholder="Status asli…" className={cn(inputClass, "mt-3 resize-y")} />
      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menulis…" : "Buat lirik"}
      </button>
      <PesanGalat pesan={galat} />
      {hasil ? (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <pre className="whitespace-pre-wrap text-badan">{hasil.lirik}</pre>
          <TombolSalin teks={hasil.lirik} />
        </div>
      ) : null}
    </Card>
  );
}


/* ---- Gamifikasi ---- */

export function BagianGamifikasi() {
  const [profil, setProfil] = useState<ProfilGamifikasi>({ xp: 0, riwayat: [] });
  const [siap, setSiap] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfil(muatProfil());
    setSiap(true);
  }, []);
  const aksi = (nama: string, xp: number) => {
    const next = tambahXp(profil, nama, xp);
    setProfil(next);
    simpanProfil(next);
  };
  if (!siap) return null;
  const info = xpKeLevelBerikutnya(profil.xp);
  const badges = badgeUntukLevel(info.level);
  return (
    <Card>
      <h2 className="text-isi font-semibold">3i. Gamifikasi (poin & level)</h2>
      <p className="mt-1 text-badan text-muted-foreground">XP bertambah lewat aksi Anda (manual).</p>
      <p className="mt-2 text-badan">Level {info.level} · XP {profil.xp} · sisa {info.sisa} ke level berikutnya</p>
      <div className="mt-2 h-2 w-full bg-muted">
        <div className="h-2 bg-primary" style={{ width: `${(info.xpDiLevel / 100) * 100}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => aksi("buat konten", 10)} className={btnGhost}>+10 buat konten</button>
        <button type="button" onClick={() => aksi("posting konten", 20)} className={btnGhost}>+20 posting</button>
        <button type="button" onClick={() => aksi("catat pemenang A/B", 15)} className={btnGhost}>+15 catat pemenang</button>
      </div>
      {badges.length > 0 ? (
        <p className="mt-2 text-meta text-muted-foreground">Badge: {badges.join(", ")}</p>
      ) : null}
    </Card>
  );
}


/* ---- LawanBots ---- */

export function BagianLawanBots() {
  const [topik, setTopik] = useState("");
  const [produka, setProduka] = useState("");
  const [produkb, setProdukb] = useState("");
  const [hasil, setHasil] = useState<LawanBots | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const jalankan = async () => {
    if (topik.trim().length < 3) {
      setGalat("Topik minimal 3 karakter.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<LawanBots>("/api/lawan-bots", {
      topik: topik.trim(),
      produkA: produka.trim() || undefined,
      produkB: produkb.trim() || undefined,
    });
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
      <h2 className="text-isi font-semibold">3j. Lawan bots</h2>
      <p className="mt-1 text-badan text-muted-foreground">Dialog debat dua bot tentang topik/produk.</p>
      <input value={topik} onChange={(e) => setTopik(e.target.value)} placeholder="Topik" className={cn(inputClass, "mt-3")} />
      <input value={produka} onChange={(e) => setProduka(e.target.value)} placeholder="Produk A (opsional)" className={cn(inputClass, "mt-2")} />
      <input value={produkb} onChange={(e) => setProdukb(e.target.value)} placeholder="Produk B (opsional)" className={cn(inputClass, "mt-2")} />
      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menulis…" : "Mulai debat"}
      </button>
      <PesanGalat pesan={galat} />
      {hasil ? (
        <div className="mt-4 space-y-2 border-t border-surface-border pt-4">
          <p className="text-badan font-semibold">Tema: {hasil.tema}</p>
          {hasil.dialog.map((d, i) => (
            <div key={i} className="border border-surface-border p-3">
              <p className="text-meta font-semibold">{d.bot}</p>
              <p className="text-badan">{d.teks}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}


/* ---- Foto ---- */

export function BagianFoto() {
  const [imageUrl, setImageUrl] = useState("");
  const [konteks, setKonteks] = useState("");
  const [hasil, setHasil] = useState<Foto | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const jalankan = async () => {
    if (!imageUrl.trim()) {
      setGalat("URL gambar wajib diisi.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<Foto>("/api/foto", { imageUrl: imageUrl.trim(), konteks: konteks.trim() || undefined });
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
      <h2 className="text-isi font-semibold">3l. Konten dari foto</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Butuh model yang mendukung visi (image_url). Masukkan URL gambar publik.
      </p>
      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://.../foto.jpg" className={cn(inputClass, "mt-3")} />
      <input value={konteks} onChange={(e) => setKonteks(e.target.value)} placeholder="Konteks (opsional)" className={cn(inputClass, "mt-2")} />
      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menulis…" : "Buat konten dari foto"}
      </button>
      <PesanGalat pesan={galat} />
      {hasil ? (
        <div className="mt-4 space-y-2 border-t border-surface-border pt-4">
          <p className="text-badan font-semibold">Tema: {hasil.tema}</p>
          {hasil.statuses.map((s, i) => (
            <div key={i} className="border border-surface-border p-3 text-badan">
              <TombolSalin teks={s} />
              <p className="mt-1">{s}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}


/* ---- Mirror ---- */

export function BagianMirror() {
  const [konten, setKonten] = useState("");
  const [namaProduk, setNamaProduk] = useState("");
  const [hasil, setHasil] = useState<Mirror | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const jalankan = async () => {
    if (konten.trim().length < 20) {
      setGalat("Konten kompetitor minimal 20 karakter.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<Mirror>("/api/mirror", {
      kontenKompetitor: konten.trim(),
      namaProduk: namaProduk.trim() || undefined,
    });
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
      <h2 className="text-isi font-semibold">3m. Mirror competitor (manual)</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Tempel konten kompetitor sebagai referensi gaya; hasil orisinal (tanpa scraping).
      </p>
      <textarea value={konten} onChange={(e) => setKonten(e.target.value)} rows={5} placeholder="Konten kompetitor…" className={cn(inputClass, "mt-3 resize-y")} />
      <input value={namaProduk} onChange={(e) => setNamaProduk(e.target.value)} placeholder="Nama produk Anda (opsional)" className={cn(inputClass, "mt-2")} />
      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menulis…" : "Buat versi orisinal"}
      </button>
      <PesanGalat pesan={galat} />
      {hasil ? (
        <div className="mt-4 space-y-2 border-t border-surface-border pt-4">
          <p className="text-badan font-semibold">Tema: {hasil.tema}</p>
          {hasil.statuses.map((s, i) => (
            <div key={i} className="border border-surface-border p-3 text-badan">
              <TombolSalin teks={s} />
              <p className="mt-1">{s}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
