"use client";

/**
 * Eksperimen A/B manual untuk hook status: user menulis hingga 5 varian,
 * mempostingnya sendiri, lalu mencatat varian mana yang menang. Tidak ada
 * posting otomatis dan tidak ada kunci AI.
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/card";
import {
  MAKS_VARIAN,
  MIN_VARIAN,
  buatEksperimen,
  catatPemenang,
  hapusEksperimen,
  muatEksperimen,
  ringkasanEksperimen,
  simpanEksperimen,
  validasiInput,
  type EksperimenHook,
} from "@/lib/konten/eksperimen-hook";
import { formatAngka } from "@/lib/impor/normalisasi";
import { cn } from "@/lib/utils";

const mikro = "font-mono text-meta uppercase tracking-meta";
const FIELD =
  "w-full border-2 border-foreground bg-background px-3 py-2 font-mono text-badan outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary";

export function EksperimenHookPanel() {
  const [daftar, setDaftar] = useState<EksperimenHook[]>([]);
  const [siap, setSiap] = useState(false);
  const [formTerbuka, setFormTerbuka] = useState(false);
  const [nama, setNama] = useState("");
  const [varian, setVarian] = useState<string[]>(Array.from({ length: MAKS_VARIAN }, () => ""));
  const [galat, setGalat] = useState<string | null>(null);
  const [abNama, setAbNama] = useState("");
  const [abDeskripsi, setAbDeskripsi] = useState("");
  const [abMasalah, setAbMasalah] = useState("");
  const [abLoading, setAbLoading] = useState(false);
  const [abGalat, setAbGalat] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi localStorage harus setelah mount agar sama dengan snapshot SSR
    setDaftar(muatEksperimen());
    setSiap(true);
  }, []);

  const ringkas = ringkasanEksperimen(daftar);

  const buatOtomatis = async () => {
    setAbGalat(null);
    if (!abNama.trim() || abDeskripsi.trim().length < 10) {
      setAbGalat("Isi nama produk dan deskripsi (min 10 karakter).");
      return;
    }
    setAbLoading(true);
    try {
      const res = await fetch("/api/ab-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaProduk: abNama,
          deskripsi: abDeskripsi,
          masalah: abMasalah || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; varian?: string[] };
      if (!res.ok || !data.ok || !Array.isArray(data.varian)) {
        setAbGalat(data.error ?? "Gagal membuat hook otomatis.");
        return;
      }
      setVarian((prev) => {
        const next = [...prev];
        next[0] = data.varian![0] ?? "";
        next[1] = data.varian![1] ?? "";
        return next;
      });
      setNama(abNama.trim());
      setFormTerbuka(true);
    } catch {
      setAbGalat("Gagal menghubungi server.");
    } finally {
      setAbLoading(false);
    }
  };

  const resetForm = () => {
    setNama("");
    setVarian(Array.from({ length: MAKS_VARIAN }, () => ""));
    setGalat(null);
    setFormTerbuka(false);
  };

  const tambah = () => {
    setGalat(null);
    const masalah = validasiInput(nama, varian);
    if (masalah) {
      setGalat(masalah);
      return;
    }
    const baru = buatEksperimen(nama, varian);
    const next = [baru, ...daftar];
    setDaftar(next);
    simpanEksperimen(next);
    resetForm();
  };

  const catat = (id: string, indeks: number | null) => {
    const hasil = catatPemenang(daftar, id, indeks);
    if (!hasil.ok) {
      setGalat(hasil.alasan ?? "Gagal mencatat pemenang.");
      return;
    }
    setDaftar(hasil.daftar);
    simpanEksperimen(hasil.daftar);
  };

  const hapus = (id: string) => {
    if (!window.confirm("Hapus eksperimen ini? Catatan pemenang ikut hilang.")) return;
    const next = hapusEksperimen(daftar, id);
    setDaftar(next);
    simpanEksperimen(next);
  };

  if (!siap) {
    return <Card className="text-badan text-muted-foreground">Memuat eksperimen hook…</Card>;
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-isi font-semibold">Eksperimen hook (A/B manual)</h2>
          <p className="mt-1 text-badan text-muted-foreground">
            Tulis hingga {MAKS_VARIAN} varian hook, posting satu per satu (manual,
            tidak otomatis), lalu catat varian mana yang menang setelah data
            klik/komisi terkumpul. Tidak butuh kunci AI.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormTerbuka((v) => !v)}
          className="inline-flex h-9 items-center border-2 border-foreground bg-primary px-4 font-mono text-meta font-semibold uppercase tracking-meta text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          {formTerbuka ? "Tutup" : "Buat eksperimen"}
        </button>
      </div>

      <div className="mt-4 border-2 border-foreground p-3 sm:p-4">
        <p className={`${mikro} mb-2`}>&lt; A/B OTOMATIS (AI, DRAFT) &gt;</p>
        <p className="mb-2 text-badan text-muted-foreground">
          AI membuat 2 varian hook dari produk; hasilnya mengisi form di bawah,
          bukan posting otomatis. Butuh sesi (kredit AI).
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            className={FIELD}
            placeholder="NAMA PRODUK"
            value={abNama}
            onChange={(e) => setAbNama(e.target.value)}
          />
          <input
            type="text"
            className={FIELD}
            placeholder="MASALAH AUDIENS (OPSIONAL)"
            value={abMasalah}
            onChange={(e) => setAbMasalah(e.target.value)}
          />
        </div>
        <textarea
          className={`${FIELD} mt-2 min-h-[4rem] resize-y`}
          placeholder="DESKRIPSI PRODUK (MIN 10 KARAKTER)"
          value={abDeskripsi}
          onChange={(e) => setAbDeskripsi(e.target.value)}
        />
        {abGalat ? (
          <p className={`${mikro} mt-2 border-2 border-status-failed bg-background px-3 py-2 text-status-failed`} role="alert">
            ! {abGalat}
          </p>
        ) : null}
        <button
          type="button"
          onClick={buatOtomatis}
          disabled={abLoading}
          className="mt-2 inline-flex h-9 items-center border-2 border-foreground bg-primary px-4 font-mono text-meta font-semibold uppercase tracking-meta text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {abLoading ? "MEMBUAT…" : "Buat 2 hook otomatis"}
        </button>
      </div>

      {formTerbuka ? (
        <div className="mt-4 space-y-3 border-2 border-foreground p-3 sm:p-4">
          <div>
            <label htmlFor="eh-nama" className={`${mikro} mb-2 block`}>
              &lt; NAMA EKSPERIMEN &gt;
            </label>
            <input
              id="eh-nama"
              type="text"
              className={FIELD}
              placeholder="MIS. HOOK PRODUK X - 5 VARIAN"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              maxLength={80}
            />
          </div>
          {Array.from({ length: MAKS_VARIAN }, (_, i) => (
            <div key={i}>
              <label htmlFor={`eh-v-${i}`} className={`${mikro} mb-2 block`}>
                &lt; VARIAN {i + 1} {i < MIN_VARIAN ? "(WAJIB)" : "(OPSIONAL)"} &gt;
              </label>
              <textarea
                id={`eh-v-${i}`}
                className={`${FIELD} min-h-[4rem] resize-y`}
                placeholder={`HOOK VARIAN ${i + 1} (MAKS 500 KARAKTER)`}
                value={varian[i]}
                onChange={(e) =>
                  setVarian((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value;
                    return next;
                  })
                }
                maxLength={500}
              />
            </div>
          ))}
          {galat ? (
            <p className={`${mikro} border-2 border-status-failed bg-background px-3 py-2 text-status-failed`} role="alert">
              ! {galat}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={tambah}
              className="inline-flex h-9 items-center border-2 border-foreground bg-primary px-4 font-mono text-meta font-semibold uppercase tracking-meta text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Simpan eksperimen
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-9 items-center border-2 border-foreground px-4 font-mono text-meta font-medium uppercase tracking-meta hover:bg-muted"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {daftar.length > 0 ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="border-2 border-foreground px-3 py-2">
              <p className={mikro}>Total eksperimen</p>
              <p className="mt-1 font-mono text-badan font-semibold tabular-nums">
                {formatAngka(ringkas.total)}
              </p>
            </div>
            <div className="border-2 border-foreground px-3 py-2">
              <p className={mikro}>Sudah dicatat pemenang</p>
              <p className="mt-1 font-mono text-badan font-semibold tabular-nums">
                {formatAngka(ringkas.tercatat)}
              </p>
            </div>
            <div className="border-2 border-foreground px-3 py-2">
              <p className={mikro}>Rata-rata varian</p>
              <p className="mt-1 font-mono text-badan font-semibold tabular-nums">
                {ringkas.rata_varian.toFixed(1)}
              </p>
            </div>
          </div>

          {ringkas.tercatat > 0 ? (
            <div className="mt-4 space-y-2">
              <p className={`${mikro} text-muted-foreground`}>Menang per slot varian</p>
              {ringkas.per_slot.map((s) => (
                <div key={s.slot} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3 text-badan">
                    <span className="font-medium">Varian {s.slot + 1}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatAngka(s.menang)} menang · {s.persen.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${s.persen > 0 ? Math.max(2, Math.round(s.persen)) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <ul className="mt-5 space-y-4">
            {daftar.map((e) => (
              <li key={e.id} className="border-2 border-foreground p-3 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{e.nama}</p>
                    <p className={`${mikro} mt-1 text-muted-foreground`}>
                      {formatAngka(e.varian.length)} varian · dibuat{" "}
                      {new Date(e.dibuat_pada).toLocaleDateString("id-ID")}
                      {e.pemenang !== null
                        ? ` · pemenang: Varian ${e.pemenang + 1}`
                        : " · belum ada pemenang"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => hapus(e.id)}
                    className={`${mikro} border-2 border-foreground px-2 py-1 text-muted-foreground hover:bg-muted`}
                  >
                    Hapus
                  </button>
                </div>

                <ol className="mt-3 space-y-2">
                  {e.varian.map((v, i) => (
                    <li
                      key={i}
                      className={cn(
                        "border-2 px-3 py-2 text-badan",
                        e.pemenang === i
                          ? "border-status-ready bg-status-ready/5"
                          : "border-surface-border",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`${mikro} text-muted-foreground`}>Varian {i + 1}</p>
                          <p className="mt-1 whitespace-pre-wrap">{v}</p>
                        </div>
                        {e.pemenang === i ? (
                          <span className={`${mikro} shrink-0 text-status-ready`}>PEMENANG</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => catat(e.id, i)}
                            className={`${mikro} shrink-0 border-2 border-foreground px-2 py-1 hover:bg-muted`}
                          >
                            Catat menang
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>

                {e.pemenang !== null ? (
                  <button
                    type="button"
                    onClick={() => catat(e.id, null)}
                    className={`${mikro} mt-3 border-2 border-foreground px-2 py-1 text-muted-foreground hover:bg-muted`}
                  >
                    Batalkan catatan
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-badan text-muted-foreground">
          Belum ada eksperimen. Buat satu untuk mulai membandingkan hook secara
          manual.
        </p>
      )}

      <p className="mt-4 text-meta text-muted-foreground">
        Catatan: varian yang menang ditentukan Anda sendiri dari data klik/komisi
        yang sudah diimpor di halaman ini. Tidak ada posting otomatis — setiap
        varian diposting manual agar tetap sesuai aturan “tidak ada siap_posting
        tanpa aksi user”.
      </p>
    </Card>
  );
}
