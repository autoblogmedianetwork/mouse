"use client";

import { useState } from "react";
import { z } from "zod";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useLocalState } from "@/lib/konten/use-local-state";
import { cn } from "@/lib/utils";

/**
 * Template Deskripsi (UI-Spec 3.7): list with name, category, usage count;
 * editor with {{NAMA_PRODUK}}, {{MANFAAT}}, {{KEKURANGAN}} placeholders;
 * preview with sample data.
 */

export const PLACEHOLDERS = ["{{NAMA_PRODUK}}", "{{MANFAAT}}", "{{KEKURANGAN}}"] as const;

export const KATEGORI_TEMPLATE = [
  "Marketplace",
  "Hosting/SaaS",
  "Kursus",
  "Lainnya",
] as const;

export type KategoriTemplate = (typeof KATEGORI_TEMPLATE)[number];

const templateSkema = z.object({
  id: z.string().min(1),
  nama: z.string().trim().min(1, "Nama wajib diisi").max(80),
  kategori: z.string().trim().min(1, "Kategori wajib diisi").max(60),
  isi: z.string().trim().min(10, "Isi template minimal 10 karakter").max(5000),
  dipakai: z.number().int().min(0),
  updated_at: z.string(),
});

export type Template = z.infer<typeof templateSkema>;

const CONTOH_DATA: Record<string, string> = {
  "{{NAMA_PRODUK}}": "Kaos polos cotton combed 30s",
  "{{MANFAAT}}": "adem dipakai seharian dan tidak mudah melar",
  "{{KEKURANGAN}}": "untuk kamu yang mudah gerah, bahan tipis ini justru cocok",
};

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const btnGhost =
  "rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium hover:bg-muted";
const btnPrimary =
  "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover";

export function isiTemplateDenganContoh(isi: string): string {
  return Object.entries(CONTOH_DATA).reduce(
    (hasil, [ph, nilai]) => hasil.split(ph).join(nilai),
    isi,
  );
}

export function EditorTemplate() {
  const [template, setTemplate] = useLocalState<Template[]>("autothreads-template", []);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", kategori: "Marketplace" as string, customKategori: "", isi: "" });
  const [error, setError] = useState<string | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [filterKategori, setFilterKategori] = useState<string>("Semua");

  const mulaiEdit = (t?: Template) => {
    if (t) {
      setEditId(t.id);
      const isPredefined = (KATEGORI_TEMPLATE as readonly string[]).includes(t.kategori);
      setForm({
        nama: t.nama,
        kategori: isPredefined ? t.kategori : "Lainnya",
        customKategori: isPredefined ? "" : t.kategori,
        isi: t.isi,
      });
    } else {
      setEditId(null);
      setForm({ nama: "", kategori: "Marketplace", customKategori: "", isi: "" });
    }
    setError(null);
  };

  const simpan = () => {
    const finalKategori =
      form.kategori === "Lainnya" && form.customKategori.trim()
        ? form.customKategori.trim()
        : form.kategori;

    const hasil = templateSkema.safeParse({
      id: editId ?? crypto.randomUUID(),
      nama: form.nama,
      kategori: finalKategori,
      isi: form.isi,
      dipakai: editId ? (template.find((t) => t.id === editId)?.dipakai ?? 0) : 0,
      updated_at: new Date().toISOString(),
    });
    if (!hasil.success) {
      setError(hasil.error.issues[0]?.message ?? "Input tidak valid.");
      return;
    }
    setTemplate((prev) => {
      const idx = prev.findIndex((t) => t.id === hasil.data.id);
      if (idx === -1) return [hasil.data, ...prev];
      const next = [...prev];
      next[idx] = hasil.data;
      return next;
    });
    mulaiEdit();
  };

  const daftarTampil =
    filterKategori === "Semua"
      ? template
      : template.filter((t) => t.kategori === filterKategori);

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={hapusId !== null}
        judul="Hapus template?"
        pesan={`Template “${template.find((t) => t.id === hapusId)?.nama ?? ""}” akan dihapus permanen.`}
        onKonfirmasi={() => {
          setTemplate((prev) => prev.filter((t) => t.id !== hapusId));
          setHapusId(null);
        }}
        onBatal={() => setHapusId(null)}
      />

      {/* Editor */}
      <section className="rounded-xl border border-surface-border bg-surface p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {editId ? "Edit template" : "Template baru"}
          </h2>
          {editId ? (
            <button type="button" onClick={() => mulaiEdit()} className={btnGhost}>
              Batalkan edit
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="t-nama" className="mb-1 block text-sm font-medium">
              Nama <span className="text-status-failed">*</span>
            </label>
            <input
              id="t-nama"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="mis. Review hosting atau Komparasi spesifikasi"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="t-kategori" className="mb-1 block text-sm font-medium">
              Kategori <span className="text-status-failed">*</span>
            </label>
            <select
              id="t-kategori"
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              className={inputClass}
            >
              {KATEGORI_TEMPLATE.map((kat) => (
                <option key={kat} value={kat}>
                  {kat}
                </option>
              ))}
            </select>
            {form.kategori === "Lainnya" && (
              <input
                id="t-custom-kategori"
                value={form.customKategori}
                onChange={(e) => setForm({ ...form, customKategori: e.target.value })}
                placeholder="Tulis nama kategori kustom..."
                className={cn(inputClass, "mt-2")}
              />
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="t-isi" className="mb-1 block text-sm font-medium">
              Isi template <span className="text-status-failed">*</span>
            </label>
            <textarea
              id="t-isi"
              rows={6}
              value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
              placeholder={`Kenalin, ${CONTOH_DATA["{{NAMA_PRODUK}}"]} — ${CONTOH_DATA["{{MANFAAT}}"]}…`}
              className={inputClass}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Sisipkan placeholder:</span>
              {PLACEHOLDERS.map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isi: `${f.isi}${ph}` }))}
                  className="rounded bg-muted px-2 py-0.5 font-mono text-xs hover:bg-muted/70"
                >
                  {ph}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <p className="mt-2 text-xs text-status-failed" role="alert">
            {error}
          </p>
        ) : null}

        {/* Preview dengan data contoh */}
        {form.isi.trim() ? (
          <div className="mt-4 rounded-lg border border-surface-border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preview (data contoh)
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {isiTemplateDenganContoh(form.isi)}
            </p>
          </div>
        ) : null}

        <div className="mt-4">
          <button type="button" onClick={simpan} className={btnPrimary}>
            {editId ? "Simpan perubahan" : "Tambah template"}
          </button>
        </div>
      </section>

      {/* Filter Kategori Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono uppercase text-muted-foreground mr-1">Filter:</span>
        {["Semua", ...KATEGORI_TEMPLATE].map((kat) => {
          const aktif = filterKategori === kat;
          return (
            <button
              key={kat}
              type="button"
              onClick={() => setFilterKategori(kat)}
              className={cn(
                "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                aktif
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-surface-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {kat}
            </button>
          );
        })}
      </div>

      {/* Daftar Template */}
      {daftarTampil.length === 0 ? (
        <EmptyState
          title={template.length === 0 ? "Belum ada template" : "Tidak ada template di kategori ini"}
          description={
            template.length === 0
              ? "Template gaya dan struktur bisa dipakai ulang untuk penawaran produk atau layanan berikutnya."
              : `Pilih filter lain atau tambahkan template baru untuk kategori "${filterKategori}".`
          }
        />
      ) : (
        <ul className="space-y-3">
          {daftarTampil.map((t) => (
            <li
              key={t.id}
              className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{t.nama}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {t.kategori}
                  </span>
                  <span className="text-xs text-muted-foreground">dipakai {t.dipakai}×</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.isi}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => mulaiEdit(t)} className={btnGhost}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setHapusId(t.id)}
                  className={`${btnGhost} text-status-failed`}
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
