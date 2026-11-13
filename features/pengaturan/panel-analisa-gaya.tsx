"use client";

/**
 * Analisa Gaya (Gelombang 4): user menempel 3-5 post publik, AI menyusun
 * DESKRIPSI gaya yang bisa dipakai mengisi persona bernama.
 *
 * Tidak fetch otomatis dari username: Threads tidak punya API publik, jadi
 * kolom sumber hanya catatan asal gaya (tidak dikirim ke AI).
 */
import { useState } from "react";
import { Card } from "@/components/card";
import { MAKS_GAYA_BICARA, rapikanGayaBicara, type HasilAnalisaGaya } from "@/lib/ai/analisa-gaya";

const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
const tombolUtama =
  "inline-flex h-9 items-center bg-primary px-3 text-meta font-medium text-primary-foreground hover:opacity-90";

export function PanelAnalisaGaya({ onPakai }: { onPakai?: (gaya: string) => void }) {
  const [sumber, setSumber] = useState("");
  const [post, setPost] = useState("");
  const [hasil, setHasil] = useState<HasilAnalisaGaya | null>(null);
  const [gaya, setGaya] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  const analisa = async () => {
    setGalat(null);
    setPesan(null);
    setSibuk(true);
    try {
      const res = await fetch("/api/ai/analisa-gaya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_mentah: post, sumber }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        hasil?: HasilAnalisaGaya;
      };
      if (!res.ok || !json.ok || !json.hasil) {
        setGalat(json.error ?? `Analisa gagal (HTTP ${res.status}).`);
        return;
      }
      setHasil(json.hasil);
      setGaya(rapikanGayaBicara(json.hasil.gaya_bicara));
    } catch {
      setGalat("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setSibuk(false);
    }
  };

  const pakai = () => {
    onPakai?.(gaya);
    setPesan("Gaya ditempel ke kolom persona. Jangan lupa simpan Pengaturan.");
  };

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-isi font-semibold">Contek gaya dari post publik</h2>
        <p className="mt-1 text-meta text-muted-foreground">
          Tempel 3–5 post (pisahkan dengan baris kosong). AI menyusun <em>deskripsi</em> gaya —
          bukan menyalin kalimat orang lain. Tempel manual karena Threads tidak menyediakan API
          publik untuk membaca profil.
        </p>
      </div>

      <label className="text-meta block">
        <span className="block text-muted-foreground">Sumber (opsional, hanya catatan)</span>
        <input
          value={sumber}
          onChange={(e) => setSumber(e.target.value)}
          placeholder="@username atau link post — tidak dikirim ke AI"
          className={inputClass}
        />
      </label>

      <textarea
        value={post}
        onChange={(e) => setPost(e.target.value)}
        rows={6}
        className={inputClass}
        placeholder={"post pertama...\n\npost kedua...\n\npost ketiga..."}
      />

      <button type="button" className={tombolUtama} onClick={analisa} disabled={sibuk || post.trim() === ""}>
        {sibuk ? "Menganalisa…" : "Analisa gaya"}
      </button>

      {galat ? <p className="text-meta text-status-failed">{galat}</p> : null}

      {hasil ? (
        <div className="space-y-2 border-t border-surface-border pt-3">
          <p className="text-badan font-medium">
            Keyakinan: {hasil.keyakinan}
            {hasil.catatan ? ` — ${hasil.catatan}` : ""}
          </p>
          <ul className="space-y-1 text-meta text-muted-foreground">
            <li>• Pola kalimat: {hasil.pola_kalimat}</li>
            <li>• Pembuka: {hasil.pembuka.join(" · ") || "-"}</li>
            <li>• Nada: {hasil.nada.join(", ") || "-"}</li>
            <li>• Ciri khas: {hasil.ciri_khas.join("; ") || "-"}</li>
            <li>• Struktur: {hasil.struktur}</li>
            <li>• Catchphrase: {hasil.catchphrase.join(" · ") || "(tidak ada yang konsisten)"}</li>
          </ul>

          <label className="text-meta block">
            <span className="block text-muted-foreground">
              Gaya bicara untuk persona ({gaya.length}/{MAKS_GAYA_BICARA})
            </span>
            <textarea
              value={gaya}
              onChange={(e) => setGaya(e.target.value.slice(0, MAKS_GAYA_BICARA))}
              rows={4}
              className={inputClass}
            />
          </label>

          <p className="text-meta text-muted-foreground">
            ⚠️ Ini analisa gaya, bukan salinan. Jangan gunakan kalimat asli orang lain.
            {sumber ? ` Inspirasi: ${sumber}` : ""}
          </p>

          <button type="button" className={tombolUtama} onClick={pakai}>
            Pakai sebagai persona
          </button>
        </div>
      ) : null}

      {pesan ? (
        <p className="text-meta text-status-ready" role="status">
          {pesan}
        </p>
      ) : null}
    </Card>
  );
}
