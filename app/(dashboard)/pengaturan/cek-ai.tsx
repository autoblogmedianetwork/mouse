"use client";

/**
 * Panel "Cek koneksi AI" di Pengaturan (UI-Spec 3.8).
 *
 * Pemeriksaan berjalan di server (`GET /api/ai/kesehatan`): kunci API tidak
 * pernah sampai ke peramban, dan komponen ini hanya menampilkan status. Tombol
 * tidak otomatis berjalan saat halaman dibuka supaya tidak memanggil provider
 * setiap kali Pengaturan dibuka.
 */
import { useState } from "react";
import type { KesehatanAI } from "@/lib/ai/kesehatan";

type Keadaan = "diam" | "memeriksa" | "selesai" | "galat";

function Baris({ label, nilai }: { label: string; nilai: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-surface-border py-2 last:border-b-0">
      <span className="text-meta text-muted-foreground">{label}</span>
      <span className="text-right text-badan font-medium">{nilai}</span>
    </div>
  );
}

export function CekKesehatanAI() {
  const [keadaan, setKeadaan] = useState<Keadaan>("diam");
  const [hasil, setHasil] = useState<KesehatanAI | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  async function periksa() {
    setKeadaan("memeriksa");
    setGalat(null);

    try {
      const response = await fetch("/api/ai/kesehatan", { cache: "no-store" });
      if (response.status === 401) {
        setHasil(null);
        setGalat("Sesi berakhir. Masuk ulang untuk memeriksa provider AI.");
        setKeadaan("galat");
        return;
      }
      if (!response.ok) {
        setHasil(null);
        setGalat(`Server menjawab HTTP ${response.status}.`);
        setKeadaan("galat");
        return;
      }

      const data = (await response.json()) as KesehatanAI & { ok: boolean };
      setHasil(data);
      setKeadaan("selesai");
    } catch {
      setHasil(null);
      setGalat("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
      setKeadaan("galat");
    }
  }

  const labelTombol =
    keadaan === "memeriksa" ? "Memeriksa…" : hasil ? "Periksa ulang" : "Cek koneksi AI";

  return (
    <div className="border border-surface-border p-3" data-testid="kesehatan-ai">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-badan font-medium">Koneksi provider</p>
          <p className="mt-0.5 text-meta text-muted-foreground">
            Menguji katalog model dan satu panggilan chat sungguhan. Kunci API tetap di server.
          </p>
        </div>
        <button
          type="button"
          onClick={periksa}
          disabled={keadaan === "memeriksa"}
          className="inline-flex h-9 items-center bg-primary px-4 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {labelTombol}
        </button>
      </div>

      {keadaan === "galat" && galat ? (
        <p className="mt-3 border border-status-failed bg-status-failed/10 px-3 py-2 text-badan text-status-failed">
          {galat}
        </p>
      ) : null}

      {hasil ? (
        <div className="mt-3">
          <p
            className={`mb-2 inline-flex items-center gap-2 border px-3 py-1 text-meta font-semibold ${
              hasil.ok
                ? "border-status-ready bg-status-ready/10 text-status-ready"
                : "border-status-failed bg-status-failed/10 text-status-failed"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${hasil.ok ? "bg-status-ready" : "bg-status-failed"}`}
              aria-hidden
            />
            {hasil.ok ? "AI siap dipakai" : "AI belum bisa dipakai"}
          </p>

          <Baris
            label="Sumber"
            nilai={
              hasil.sumber === "database"
                ? `Provider database${hasil.namaProvider ? ` · ${hasil.namaProvider}` : ""}`
                : "Env server"
            }
          />
          <Baris label="Base URL" nilai={<code className="text-meta">{hasil.baseUrl}</code>} />
          <Baris label="Model" nilai={<code className="text-meta">{hasil.model}</code>} />
          <Baris
            label="Kunci API"
            nilai={hasil.kunciAda ? "Terpasang di server" : "Belum diisi"}
          />
          <Baris
            label="Katalog model"
            nilai={
              hasil.katalogTerbaca
                ? `${hasil.daftarModel.length} model terbaca`
                : "Tidak terbaca"
            }
          />
          <Baris
            label="Model terdaftar"
            nilai={
              hasil.modelTerdaftar ? "Ya" : hasil.katalogTerbaca ? "Tidak ada di katalog" : "Tidak diketahui"
            }
          />
          <Baris
            label="Latensi chat"
            nilai={hasil.latensiMs !== null ? `${hasil.latensiMs} ms` : "—"}
          />
          <Baris
            label="Diperiksa"
            nilai={
              <span className="text-meta text-muted-foreground">
                {new Date(hasil.diperiksaPada).toLocaleString("id-ID")}
              </span>
            }
          />

          {hasil.pesan ? (
            <p className="mt-2 border border-warning/40 bg-warning/10 px-3 py-2 text-meta text-warning-foreground">
              {hasil.pesan}
            </p>
          ) : null}

          {hasil.daftarModel.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-meta text-muted-foreground">
                Lihat {hasil.daftarModel.length} model yang tersedia
              </summary>
              <ul className="mt-2 space-y-1">
                {hasil.daftarModel.map((item) => (
                  <li key={item.id} className="font-mono text-meta">
                    {item.id}
                    {item.id === hasil.model ? (
                      <span className="ml-2 text-muted-foreground">(dipakai)</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
