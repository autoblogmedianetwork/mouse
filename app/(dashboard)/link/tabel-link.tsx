"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Konten } from "@/lib/konten/skema";
import { useLocalState } from "@/lib/konten/use-local-state";
import {
  programAffiliateSkema,
  type ProgramAffiliate,
} from "@/lib/program-affiliate/skema";
import { cn } from "@/lib/utils";

/**
 * Link Affiliate (UI-Spec 3.6 / PRD F5 & Tahap 4):
 * Manajemen program affiliate, link URL, catatan aturan (e.g. larangan sebut brand),
 * serta tracking manual klik dan komisi.
 */

interface CatatanLink {
  klik: number;
  komisi: number;
}

const DEFAULT_CATATAN: CatatanLink = { klik: 0, komisi: 0 };

const inputClass =
  "w-full rounded-none border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary font-mono text-xs";
const btnGhost =
  "rounded-none border border-surface-border px-3 py-1.5 text-xs font-mono font-medium hover:bg-muted transition-colors";
const btnPrimary =
  "rounded-none bg-primary px-4 py-2 text-xs font-mono font-medium text-primary-foreground hover:bg-primary-hover transition-colors";

export function TabelLink() {
  const [konten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [catatan, setCatatan] = useLocalState<Record<string, CatatanLink>>(
    "autothreads-link-catatan",
    {},
  );
  const [programs, setPrograms] = useLocalState<ProgramAffiliate[]>(
    "autothreads-link-programs",
    [],
  );

  // State Form Modal / Inline
  const [bukaForm, setBukaForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nama_program: "",
    url: "",
    catatan_aturan: "",
    klik: 0,
    komisi: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);

  // Gabungkan program tersimpan dan link dari konten
  const daftarGabungan = useMemo(() => {
    const peta = new Map<
      string,
      {
        id?: string;
        nama_program: string;
        url: string;
        catatan_aturan: string;
        klik: number;
        komisi: number;
        jumlahKonten: number;
        dibuat: string;
      }
    >();

    // Masukkan data dari program eksplisit
    for (const p of programs) {
      const c = catatan[p.url] ?? { klik: p.klik, komisi: p.komisi };
      peta.set(p.url, {
        id: p.id,
        nama_program: p.nama_program,
        url: p.url,
        catatan_aturan: p.catatan_aturan || "",
        klik: c.klik,
        komisi: c.komisi,
        jumlahKonten: 0,
        dibuat: p.created_at,
      });
    }

    // Masukkan data dari konten yang terbit/dibuat
    for (const k of konten) {
      if (!k.link_produk) continue;
      const existing = peta.get(k.link_produk);
      if (existing) {
        existing.jumlahKonten += 1;
      } else {
        const c = catatan[k.link_produk] ?? DEFAULT_CATATAN;
        peta.set(k.link_produk, {
          nama_program: k.produk_nama || k.judul,
          url: k.link_produk,
          catatan_aturan: "",
          klik: c.klik,
          komisi: c.komisi,
          jumlahKonten: 1,
          dibuat: k.created_at,
        });
      }
    }

    return [...peta.values()].sort((a, b) => b.jumlahKonten - a.jumlahKonten);
  }, [programs, konten, catatan]);

  const mulaiTambah = () => {
    setEditId(null);
    setForm({
      nama_program: "",
      url: "",
      catatan_aturan: "",
      klik: 0,
      komisi: 0,
    });
    setFormError(null);
    setBukaForm(true);
  };

  const mulaiEdit = (item: (typeof daftarGabungan)[0]) => {
    setEditId(item.id ?? null);
    setForm({
      nama_program: item.nama_program,
      url: item.url,
      catatan_aturan: item.catatan_aturan,
      klik: item.klik,
      komisi: item.komisi,
    });
    setFormError(null);
    setBukaForm(true);
  };

  const simpanProgram = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const hasil = programAffiliateSkema.safeParse({
      id: editId ?? crypto.randomUUID(),
      nama_program: form.nama_program,
      url: form.url,
      catatan_aturan: form.catatan_aturan,
      klik: form.klik,
      komisi: form.komisi,
      updated_at: new Date().toISOString(),
    });

    if (!hasil.success) {
      setFormError(hasil.error.issues[0]?.message ?? "Input tidak valid.");
      return;
    }

    const data = hasil.data;

    // Simpan ke daftar programs
    setPrograms((prev) => {
      const idx = prev.findIndex((p) => p.id === data.id || p.url === data.url);
      if (idx === -1) return [data, ...prev];
      const next = [...prev];
      next[idx] = { ...next[idx], ...data };
      return next;
    });

    // Sinkronkan klik & komisi ke catatan
    setCatatan((prev) => ({
      ...prev,
      [data.url]: { klik: data.klik, komisi: data.komisi },
    }));

    setBukaForm(false);
  };

  const ubahKlikKomisi = (url: string, patch: Partial<CatatanLink>) => {
    const nextCatatan = { ...DEFAULT_CATATAN, ...catatan[url], ...patch };
    setCatatan((prev) => ({
      ...prev,
      [url]: nextCatatan,
    }));

    // Update jika link ini tersimpan di programs
    setPrograms((prev) =>
      prev.map((p) => (p.url === url ? { ...p, ...patch } : p)),
    );
  };

  const totalKlik = daftarGabungan.reduce((s, c) => s + c.klik, 0);
  const totalKomisi = daftarGabungan.reduce((s, c) => s + c.komisi, 0);
  const teratas = [...daftarGabungan].sort((a, b) => b.klik - a.klik)[0];

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={hapusId !== null}
        judul="Hapus program affiliate?"
        pesan="Program dan catatan aturan ini akan dihapus dari daftar."
        onKonfirmasi={() => {
          setPrograms((prev) => prev.filter((p) => p.id !== hapusId));
          setHapusId(null);
        }}
        onBatal={() => setHapusId(null)}
      />

      {/* Header Bar Actions & Ringkasan */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-3 sm:grid-cols-3 flex-1">
          <div className="rounded-none border border-surface-border bg-surface p-4">
            <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
              Total klik
            </p>
            <p className="mt-1 text-2xl font-mono font-semibold tabular-nums">{totalKlik}</p>
          </div>
          <div className="rounded-none border border-surface-border bg-surface p-4">
            <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
              Total komisi
            </p>
            <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-status-success">
              Rp {totalKomisi.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="rounded-none border border-surface-border bg-surface p-4">
            <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
              Program teratas
            </p>
            <p className="mt-1 truncate text-sm font-mono font-medium">
              {teratas && teratas.klik > 0 ? teratas.nama_program : "—"}
            </p>
          </div>
        </div>

        <button type="button" onClick={mulaiTambah} className={cn(btnPrimary, "shrink-0 self-start")}>
          + Tambah program baru
        </button>
      </div>

      {/* Form Tambah/Edit Program Modal/Panel */}
      {bukaForm ? (
        <section className="rounded-none border border-surface-border bg-surface p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider">
              {editId ? "Edit program affiliate" : "Tambah program affiliate baru"}
            </h2>
            <button
              type="button"
              onClick={() => setBukaForm(false)}
              className={btnGhost}
            >
              Tutup
            </button>
          </div>

          <form onSubmit={simpanProgram} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-mono uppercase text-muted-foreground">
                  Nama program <span className="text-status-failed">*</span>
                </label>
                <input
                  required
                  value={form.nama_program}
                  onChange={(e) => setForm({ ...form, nama_program: e.target.value })}
                  placeholder="mis. Hostinger Affiliate atau Shopee Affiliate"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-mono uppercase text-muted-foreground">
                  Link affiliate URL <span className="text-status-failed">*</span>
                </label>
                <input
                  required
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-mono uppercase text-muted-foreground">
                  Catatan aturan program (ditampilkan sebagai pengingat di alur posting)
                </label>
                <textarea
                  rows={3}
                  value={form.catatan_aturan}
                  onChange={(e) => setForm({ ...form, catatan_aturan: e.target.value })}
                  placeholder="mis. Dilarang menyebut nama brand di headline; wajib cantumkan kupon diskon 20%; dilarang klaim garansi palsu."
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-muted-foreground font-mono">
                  Aturan ini akan otomatis muncul sebagai banner pengingat saat Anda membuat posting untuk produk/link ini.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-mono uppercase text-muted-foreground">
                  Catatan klik awal
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.klik}
                  onChange={(e) => setForm({ ...form, klik: Math.max(0, Number(e.target.value) || 0) })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-mono uppercase text-muted-foreground">
                  Catatan komisi awal (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={form.komisi}
                  onChange={(e) =>
                    setForm({ ...form, komisi: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            {formError ? (
              <p className="text-xs font-mono text-status-failed" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>
                {editId ? "Simpan perubahan" : "Simpan program"}
              </button>
              <button
                type="button"
                onClick={() => setBukaForm(false)}
                className={btnGhost}
              >
                Batal
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Tabel Program & Link */}
      {daftarGabungan.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="Belum ada link atau program affiliate"
            description="Tambahkan program affiliate baru atau buat posting dengan link penawaran untuk memantau performa di sini."
            actionLabel="Buka Buat posting"
            actionHref="/posting/baru"
          />
          <div className="text-center">
            <button type="button" onClick={mulaiTambah} className={btnPrimary}>
              + Tambah program affiliate baru
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-none border border-surface-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs font-mono uppercase tracking-wider text-muted-foreground bg-muted/20">
                <th className="px-4 py-3 font-medium">Program / Penawaran</th>
                <th className="px-4 py-3 font-medium">Link Affiliate</th>
                <th className="px-4 py-3 font-medium">Catatan Aturan</th>
                <th className="px-4 py-3 font-medium">Klik</th>
                <th className="px-4 py-3 font-medium">Komisi (Rp)</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-mono text-xs">
              {daftarGabungan.map((b) => (
                <tr key={b.url} className="hover:bg-muted/10">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div>{b.nama_program}</div>
                    {b.jumlahKonten > 0 ? (
                      <span className="text-[10px] text-muted-foreground">
                        {b.jumlahKonten} posting dibuat
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-primary underline-offset-2 hover:underline"
                    >
                      {b.url}
                    </a>
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    {b.catatan_aturan ? (
                      <div className="rounded border border-amber-500/30 bg-amber-500/10 p-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                        <span className="font-semibold">⚠️ Aturan:</span> {b.catatan_aturan}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">
                        Tidak ada aturan khusus
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={b.klik}
                      aria-label={`Klik untuk ${b.nama_program}`}
                      onChange={(e) =>
                        ubahKlikKomisi(b.url, {
                          klik: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className={cn(inputClass, "w-20")}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={b.komisi}
                      aria-label={`Komisi untuk ${b.nama_program}`}
                      onChange={(e) =>
                        ubahKlikKomisi(b.url, {
                          komisi: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className={cn(inputClass, "w-28")}
                    />
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => mulaiEdit(b)}
                      className={btnGhost}
                    >
                      Edit
                    </button>
                    {b.id ? (
                      <button
                        type="button"
                        onClick={() => setHapusId(b.id!)}
                        className={cn(btnGhost, "text-status-failed")}
                      >
                        Hapus
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
