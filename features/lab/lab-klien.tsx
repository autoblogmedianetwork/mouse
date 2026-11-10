"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import {
  LABEL_LAB_PERSONA,
  type IdeMasalah,
  type LabUji,
  type Serial7,
  type Serial30,
  type Ghostwriter,
  type Battle,
  type Jujur,
  type Paralel,
  type Nyanyian,
  type LawanBots,
  type Foto,
  type Mirror,
} from "@/lib/ai/schemas";
import { bangkitkanHashtag } from "@/lib/konten/hashtag";
import { muatBank, type ItemBank } from "@/lib/riset/bank-masalah";
import {
  badgeUntukLevel,
  muatProfil,
  simpanProfil,
  tambahXp,
  xpKeLevelBerikutnya,
  type ProfilGamifikasi,
} from "@/lib/konten/gamifikasi";
import {
  buatTimeCapsule,
  hapusTimeCapsule,
  muatTimeCapsule,
  siapDibuka,
  simpanTimeCapsule,
  tandaiDibuka,
  validasiTimeCapsule,
  type TimeCapsule,
} from "@/lib/konten/time-capsule";
import { cn } from "@/lib/utils";
import { NotifikasiProaktif } from "@/features/lab/notifikasi-proaktif";

const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
const btnPrimary =
  "inline-flex h-9 items-center bg-primary px-4 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50";
const btnGhost = "border border-surface-border px-3 py-1.5 text-meta font-medium hover:bg-muted";

interface Balasan<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function panggilAI<T>(url: string, body: unknown): Promise<Balasan<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      data?: T;
      error?: string;
    };
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error ?? `Permintaan gagal (${res.status}).` };
    }
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "Tidak bisa menghubungi server. Cek koneksi lalu coba lagi." };
  }
}

function TombolSalin({ teks }: { teks: string }) {
  const [status, setStatus] = useState<"idle" | "ok" | "gagal">("idle");
  return (
    <button
      type="button"
      onClick={() => {
        void (async () => {
          try {
            await navigator.clipboard.writeText(teks);
            setStatus("ok");
          } catch {
            setStatus("gagal");
          }
          setTimeout(() => setStatus("idle"), 2000);
        })();
      }}
      className={btnGhost}
    >
      {status === "ok" ? "Tersalin" : status === "gagal" ? "Salin manual" : "Salin"}
    </button>
  );
}

function PesanGalat({ pesan }: { pesan: string }) {
  if (!pesan) return null;
  return (
    <p className="mt-3 text-badan text-status-failed" aria-live="polite">
      {pesan}
    </p>
  );
}

/* ------------------------------ 1. Lab uji ------------------------------ */

function BagianLabUji() {
  const [teks, setTeks] = useState("");
  const [produk, setProduk] = useState("");
  const [hasil, setHasil] = useState<LabUji | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");

  const jalankan = async () => {
    const statuses = teks
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
    if (statuses.length === 0) {
      setGalat("Tempel dulu konten yang mau diuji.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<LabUji>("/api/lab-uji", {
      statuses,
      produk: produk.trim() || undefined,
    });
    setMemuat(false);
    if (!res.ok || !res.data) {
      setHasil(null);
      setGalat(res.error ?? "Lab uji gagal.");
      return;
    }
    setHasil(res.data);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">1. Lab uji konten (simulator pembeli)</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Konten dibaca tiga pembeli virtual — skeptis, ibu muda, dan mahasiswa — sebelum Anda
        posting. Pisahkan tiap status dengan satu baris kosong.
      </p>

      <label className="mt-4 block text-meta font-medium">
        Nama produk (opsional)
        <input
          value={produk}
          onChange={(e) => setProduk(e.target.value)}
          placeholder="Tumbler 500ml"
          className={cn(inputClass, "mt-1")}
        />
      </label>

      <label className="mt-3 block text-meta font-medium">
        Konten yang diuji
        <textarea
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          rows={7}
          placeholder={"Tumbler ini bikin pagi lebih rapi.\n\nCek link di bio ya."}
          className={cn(inputClass, "mt-1 resize-y")}
        />
      </label>

      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menilai…" : "Uji konten"}
      </button>
      <PesanGalat pesan={galat} />

      {hasil ? (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="text-isi font-semibold">Skor kesiapan {hasil.skor}/100</p>
            <span className="text-meta text-muted-foreground">
              {hasil.skor >= 80 ? "Siap posting" : hasil.skor >= 60 ? "Perlu sedikit revisi" : "Banyak yang perlu diperbaiki"}
            </span>
          </div>
          <p className="text-badan text-muted-foreground">{hasil.ringkasan}</p>

          <ul className="grid gap-3 lg:grid-cols-3">
            {hasil.penilaian.map((p) => (
              <li key={p.persona} className="border border-surface-border p-3">
                <p className="text-meta font-semibold uppercase tracking-badge text-muted-foreground">
                  {LABEL_LAB_PERSONA[p.persona]}
                </p>
                <p className="mt-2 text-badan">{p.reaksi}</p>
                {p.keberatan.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-meta text-muted-foreground">
                    {p.keberatan.map((k) => (
                      <li key={k}>{k}</li>
                    ))}
                  </ul>
                ) : null}
                {p.saran ? (
                  <p className="mt-2 text-meta">
                    <span className="font-medium">Saran: </span>
                    {p.saran}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

/* --------------------------- 2. Ide dari masalah --------------------------- */

function BagianIdeMasalah() {
  const [bank, setBank] = useState<ItemBank[]>([]);
  const [masalah, setMasalah] = useState("");
  const [produk, setProduk] = useState("");
  const [hasil, setHasil] = useState<IdeMasalah | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");

  useEffect(() => {
    // Bank masalah hidup di localStorage; dibaca setelah mount supaya markup
    // server dan klien tetap sama.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBank(muatBank());
  }, []);

  const jalankan = async () => {
    const teksMasalah = masalah.trim();
    if (teksMasalah.length < 10) {
      setGalat("Pilih dari bank atau tulis masalah minimal 10 karakter.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<IdeMasalah>("/api/ide-masalah", {
      masalah: teksMasalah,
      produk: produk.trim() || undefined,
      kategori: bank.find((b) => b.teks === teksMasalah)?.kategori || undefined,
    });
    setMemuat(false);
    if (!res.ok || !res.data) {
      setHasil(null);
      setGalat(res.error ?? "Mesin ide gagal.");
      return;
    }
    setHasil(res.data);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">2. Mesin ide dari bank masalah</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Pilih satu masalah hasil riset audiens, lalu dapatkan tiga hook dengan sudut berbeda.
        Bank masalah terisi otomatis dari halaman Riset audiens.
      </p>

      {bank.length > 0 ? (
        <label className="mt-4 block text-meta font-medium">
          Masalah dari bank ({bank.length})
          <select
            value={bank.some((b) => b.teks === masalah) ? masalah : ""}
            onChange={(e) => setMasalah(e.target.value)}
            className={cn(inputClass, "mt-1")}
          >
            <option value="">Pilih masalah…</option>
            {bank.map((b) => (
              <option key={`${b.teks}-${b.ditambahkan}`} value={b.teks}>
                {b.kategori ? `[${b.kategori}] ` : ""}
                {b.teks}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="mt-3 text-meta text-muted-foreground">
          Bank masih kosong. Tambahkan masalah dari Riset audiens, atau tulis manual di bawah.
        </p>
      )}

      <label className="mt-3 block text-meta font-medium">
        Masalah audiens
        <textarea
          value={masalah}
          onChange={(e) => setMasalah(e.target.value)}
          rows={2}
          placeholder="tas cepat kotor saat hujan"
          className={cn(inputClass, "mt-1 resize-y")}
        />
      </label>

      <label className="mt-3 block text-meta font-medium">
        Produk yang mau dipromosikan (opsional)
        <input
          value={produk}
          onChange={(e) => setProduk(e.target.value)}
          placeholder="Tas kanvas anti air"
          className={cn(inputClass, "mt-1")}
        />
      </label>

      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menyusun…" : "Buat 3 hook"}
      </button>
      <PesanGalat pesan={galat} />

      {hasil ? (
        <ol className="mt-4 space-y-3 border-t border-surface-border pt-4">
          {hasil.ide.map((ide, i) => (
            <li key={i} className="border border-surface-border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-badan font-medium">{ide.hook}</p>
                <TombolSalin teks={ide.hook} />
              </div>
              <p className="mt-2 text-meta text-muted-foreground">
                Sudut: {ide.sudut}
              </p>
              <p className="mt-1 text-meta">Jembatan: {ide.jembatan}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </Card>
  );
}

/* ----------------------------- 3. Serial 7 hari ----------------------------- */

function BagianSerial() {
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

function BagianHashtag() {
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

function BagianSerial30() {
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

function BagianGhostwriter() {
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

function BagianBattle() {
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

function BagianJujur() {
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

function BagianParalel() {
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

function BagianTimeCapsule() {
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

function BagianNyanyian() {
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

function BagianGamifikasi() {
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

function BagianLawanBots() {
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

function BagianFoto() {
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

function BagianMirror() {
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

export function LabKlien() {
  return (
    <div className="space-y-6">
      <p className="text-meta text-muted-foreground">
        Semua keluaran AI berstatus draft. Tidak ada yang menjadi siap posting tanpa checklist dan
        tindakan Anda. Panggilan AI memakai kredit server dan dihentikan otomatis saat batas biaya
        bulanan tercapai.
      </p>
      <BagianLabUji />
      <BagianIdeMasalah />
      <BagianSerial />
      <BagianSerial30 />
      <BagianGhostwriter />
      <BagianBattle />
      <BagianJujur />
      <BagianParalel />
      <BagianTimeCapsule />
      <BagianNyanyian />
      <BagianGamifikasi />
      <BagianLawanBots />
      <BagianHashtag />
      <NotifikasiProaktif />
      <BagianFoto />
      <BagianMirror />
    </div>
  );
}
