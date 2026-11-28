"use client";

/**
 * BagianUtasPanjang — ide #5 (riset 17 Nov): generator review panjang untuk
 * LAMPIRAN TEKS Threads (fitur baru Threads, sampai 10.000 karakter).
 * Review produk mendalam tanpa pecah 5 status. Draft-only: user menempel
 * hasilnya ke lampiran teks Threads secara manual.
 */
import { useState } from "react";
import { Card } from "@/components/card";
import { cn } from "@/lib/utils";
import { inputClass, btnPrimary, TombolSalin, PesanGalat, panggilAI } from "./lab-bersama";
import type { UtasPanjang } from "@/lib/ai/schemas";

const OPSI_PANJANG = [
  { nilai: "3000", label: "±3.000 karakter" },
  { nilai: "6000", label: "±6.000 karakter" },
  { nilai: "10000", label: "±10.000 karakter (maks Threads)" },
] as const;

export function BagianUtasPanjang() {
  const [produkNama, setProdukNama] = useState("");
  const [fakta, setFakta] = useState("");
  const [panjangTarget, setPanjangTarget] = useState<"3000" | "6000" | "10000">("6000");
  const [gayaBicara, setGayaBicara] = useState("");
  const [hasil, setHasil] = useState<UtasPanjang | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");

  const jalankan = async () => {
    if (produkNama.trim().length < 2) {
      setGalat("Nama produk minimal 2 karakter.");
      return;
    }
    if (fakta.trim().length < 20) {
      setGalat("Fakta produk minimal 20 karakter — tulis spesifikasi dan pengalamanmu.");
      return;
    }
    setMemuat(true);
    setGalat("");
    const res = await panggilAI<UtasPanjang>("/api/ai/utas-panjang", {
      produkNama: produkNama.trim(),
      fakta: fakta.trim(),
      panjangTarget,
      gayaBicara: gayaBicara.trim() || undefined,
    });
    setMemuat(false);
    if (!res.ok || !res.data) {
      setHasil(null);
      setGalat(res.error ?? "Gagal menulis utas.");
      return;
    }
    setHasil(res.data);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">Utas panjang (lampiran teks Threads)</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Threads kini punya lampiran teks sampai 10.000 karakter — review produk mendalam
        tanpa pecah 5 status. Isi nama produk + fakta (spesifikasi, pengalaman pakai),
        AI menulis review panjang berstruktur: pembuka, kesan pertama, detail, KEKURANGAN
        (wajib — review tanpa kekurangan tidak dipercaya), untuk siapa cocok/tidak, penutup.
        Cara pakai: salin teksnya, buat postingan pendek di Threads, tempel ini ke lampiran teks.
      </p>
      <input
        value={produkNama}
        onChange={(e) => setProdukNama(e.target.value)}
        placeholder="Nama produk…"
        className={cn(inputClass, "mt-3")}
      />
      <textarea
        value={fakta}
        onChange={(e) => setFakta(e.target.value)}
        rows={5}
        placeholder="Fakta produk: spesifikasi, harga kisaran, pengalamanmu memakainya…"
        className={cn(inputClass, "mt-2 resize-y")}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="text-meta text-muted-foreground" htmlFor="utas-panjang-target">
          Panjang:
        </label>
        <select
          id="utas-panjang-target"
          value={panjangTarget}
          onChange={(e) => setPanjangTarget(e.target.value as "3000" | "6000" | "10000")}
          className="h-11 sm:h-9 border border-surface-border bg-surface px-2 text-meta"
        >
          {OPSI_PANJANG.map((o) => (
            <option key={o.nilai} value={o.nilai}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <input
        value={gayaBicara}
        onChange={(e) => setGayaBicara(e.target.value)}
        placeholder="Gaya bicara tambahan (opsional)…"
        className={cn(inputClass, "mt-2")}
      />
      <button type="button" onClick={() => void jalankan()} disabled={memuat} className={cn(btnPrimary, "mt-3")}>
        {memuat ? "Menulis…" : "Tulis utas panjang"}
      </button>
      <PesanGalat pesan={galat} />

      {hasil ? (
        <div className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <p className="text-meta text-muted-foreground">
            {hasil.teks.length} karakter {hasil.teks.length > 10000 ? "— MELEBIHI BATAS, pangkas!" : ""}
          </p>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded border border-surface-border bg-muted p-3 text-badan">
            {hasil.teks}
          </pre>
          <TombolSalin teks={hasil.teks} />
          <details>
            <summary className="cursor-pointer text-meta text-muted-foreground">Struktur yang dipakai</summary>
            <ol className="mt-1 list-decimal pl-5 text-badan">
              {hasil.struktur.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </details>
          {hasil.catatan ? (
            <p className="text-meta text-muted-foreground">Catatan AI: {hasil.catatan}</p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
