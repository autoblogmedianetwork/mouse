"use client";

/**
 * Uji & ide masalah halaman Lab (refactor R6). Dipindah utuh dari
 * lab-klien.tsx — tidak ada perubahan perilaku.
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/card";
import { LABEL_LAB_PERSONA, type IdeMasalah, type LabUji } from "@/lib/ai/schemas";
import { muatBank, type ItemBank } from "@/lib/riset/bank-masalah";
import { cn } from "@/lib/utils";
import { inputClass, btnPrimary, TombolSalin, PesanGalat, panggilAI } from "./lab-bersama";


/* ---- LabUji ---- */

export function BagianLabUji() {
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


/* ---- IdeMasalah ---- */

export function BagianIdeMasalah() {
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
