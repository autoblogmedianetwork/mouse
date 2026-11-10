"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/card";
import {
  LABEL_LAB_PERSONA,
  type IdeMasalah,
  type LabUji,
  type Serial7,
} from "@/lib/ai/schemas";
import { muatBank, type ItemBank } from "@/lib/riset/bank-masalah";
import { cn } from "@/lib/utils";

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
    </div>
  );
}
