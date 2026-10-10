"use client";

import { useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/status-badge";
import {
  arsipkanKonten,
  duplikatKonten,
  hapusKonten,
} from "@/lib/konten/store";
import { FILTER_AWAL, filterKonten, type Konten, type KontenFilter } from "@/lib/konten/skema";
import { eksporJSON, eksporTXT, gabungKonten, imporJSON } from "@/lib/konten/ekspor";
import { useLocalState } from "@/lib/konten/use-local-state";
import { subIdDefault } from "@/lib/performa/atribusi";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: Array<{ value: KontenFilter["status"]; label: string }> = [
  { value: "semua", label: "Semua status" },
  { value: "draft", label: "Draft" },
  { value: "siap_posting", label: "Siap posting" },
  { value: "terjadwal", label: "Terjadwal" },
  { value: "terkirim", label: "Terkirim" },
  { value: "gagal", label: "Gagal" },
];

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const btnGhost =
  "rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium hover:bg-muted";

function unduh(namaFile: string, isi: string, mime: string) {
  const blob = new Blob([isi], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  a.click();
  URL.revokeObjectURL(url);
}

export function PustakaKonten() {
  const [konten, setKonten] = useLocalState<Konten[]>("autothreads-konten", []);
  const [filter, setFilter] = useState<KontenFilter>(FILTER_AWAL);
  const [bukaId, setBukaId] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<{
    id: string;
    judul: string;
    aksi: "hapus" | "arsip";
  } | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasil = useMemo(() => filterKonten(konten, filter), [konten, filter]);

  const lakukan = (fn: (list: Konten[]) => Konten[]) => {
    setKonten((prev) => {
      const next = fn(prev);
      return next;
    });
  };

  const onHapus = (id: string) => {
    const judul = konten.find((k) => k.id === id)?.judul ?? "konten";
    setKonfirmasi({ id, judul, aksi: "hapus" });
  };

  const onArsip = (id: string) => {
    const k = konten.find((x) => x.id === id);
    if (!k) return;
    if (k.arsip) {
      lakukan((list) => arsipkanKonten(list, id, false));
      setPesan("Konten dikembalikan dari arsip.");
      return;
    }
    setKonfirmasi({ id, judul: k.judul, aksi: "arsip" });
  };

  const onDuplikat = (id: string) => {
    const k = konten.find((x) => x.id === id);
    if (!k) return;
    lakukan((list) => [duplikatKonten(k), ...list]);
    setPesan("Konten diduplikat sebagai draft baru.");
  };

  const ekspor = (format: "json" | "txt") => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "json") {
      unduh(`autothreads-cadangan-${stamp}.json`, eksporJSON(konten), "application/json");
    } else {
      unduh(`autothreads-konten-${stamp}.txt`, eksporTXT(hasil), "text/plain");
    }
    setPesan(`Ekspor ${format.toUpperCase()} diunduh.`);
  };

  const impor = async (file: File) => {
    try {
      const teks = await file.text();
      const data = imporJSON(teks);
      setKonten((prev) => gabungKonten(prev, data));
      setPesan(`${data.length} konten diimpor dari cadangan.`);
    } catch (err) {
      setPesan(err instanceof Error ? err.message : "Impor gagal.");
    }
  };

  /** Kode pelacak konten: ditempel di kolom sub_id/Creator pada link affiliate. */
  const salinSubId = (id: string) => {
    const kode = subIdDefault(id);
    void navigator.clipboard.writeText(kode);
    setPesan(`Kode pelacak ${kode} disalin. Tempel di kolom sub_id pada link affiliate.`);
  };

  const dibuka = bukaId ? konten.find((k) => k.id === bukaId) : null;

  return (
    <div className="space-y-4">
      {pesan ? (
        <p className="text-sm text-status-ready" aria-live="polite">
          {pesan}
        </p>
      ) : null}

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Cari judul atau isi status…"
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
          aria-label="Cari konten"
          className={cn(inputClass, "sm:max-w-xs")}
        />
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value as KontenFilter["status"] })}
          aria-label="Filter status"
          className={cn(inputClass, "sm:w-44")}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={filter.rentang}
          onChange={(e) => setFilter({ ...filter, rentang: e.target.value as KontenFilter["rentang"] })}
          aria-label="Filter tanggal"
          className={cn(inputClass, "sm:w-40")}
        >
          <option value="semua">Semua tanggal</option>
          <option value="7d">7 hari terakhir</option>
          <option value="30d">30 hari terakhir</option>
        </select>

        <div className="flex gap-2 sm:ml-auto">
          <button type="button" onClick={() => ekspor("json")} className={btnGhost}>
            Ekspor JSON
          </button>
          <button type="button" onClick={() => ekspor("txt")} className={btnGhost}>
            Ekspor TXT
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={btnGhost}>
            Impor JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="File cadangan JSON"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void impor(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {hasil.length === 0 ? (
        <EmptyState
          title={konten.length === 0 ? "Pustaka masih kosong" : "Tidak ada yang cocok"}
          description={
            konten.length === 0
              ? "Konten yang Anda buat dari halaman Buat posting akan tersimpan di sini sebagai draft."
              : "Ubah kata kunci atau filter status untuk melihat konten lain."
          }
          actionLabel="Buka Buat posting"
          actionHref="/posting/baru"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hasil.map((k) => (
            <li
              key={k.id}
              className="flex flex-col rounded-xl border border-surface-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-5">{k.judul}</h3>
                <StatusBadge status={k.status} />
              </div>
              {k.produk_nama ? (
                <p className="mt-1 text-xs text-muted-foreground">{k.produk_nama}</p>
              ) : null}
              <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                {k.statuses[0]}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {k.statuses.length} status ·{" "}
                {k.arsip
                  ? `diarsipkan ${k.arsip_at ? new Date(k.arsip_at).toLocaleDateString("id-ID") : ""}`
                  : `diubah ${new Date(k.updated_at).toLocaleDateString("id-ID")}`}
                {k.letak_link !== "tanpa_link" ? " · link aktif" : ""}
              </p>

              <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>Kode pelacak</span>
                <span className="font-mono text-foreground">{subIdDefault(k.id)}</span>
                <button
                  type="button"
                  onClick={() => salinSubId(k.id)}
                  className="underline-offset-2 hover:text-foreground hover:underline"
                  aria-label={`Salin kode pelacak ${k.judul}`}
                >
                  Salin
                </button>
              </p>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-surface-border pt-3">
                <button type="button" onClick={() => setBukaId(k.id)} className={btnGhost}>
                  Buka
                </button>
                <button type="button" onClick={() => onDuplikat(k.id)} className={btnGhost}>
                  Duplikat
                </button>
                <button type="button" onClick={() => onArsip(k.id)} className={btnGhost}>
                  {k.arsip ? "Keluarkan dari arsip" : "Arsipkan"}
                </button>
                <button
                  type="button"
                  onClick={() => onHapus(k.id)}
                  className={cn(btnGhost, "text-status-failed")}
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Dialog buka: baca-saja + salin, tanpa merusak draft aktif */}
      {dibuka ? (
        <ConfirmDialog
          open
          judul={dibuka.judul}
          pesan={`${dibuka.statuses.length} status · ${dibuka.status === "siap_posting" ? "siap posting" : "draft"}. Menutup dialog ini tidak mengubah apa pun. Untuk mengedit, buka lewat Buat posting setelah menyalin teksnya.`}
          labelKonfirmasi="Salin utas"
          destructive={false}
          onKonfirmasi={() => {
            void navigator.clipboard.writeText(
              dibuka.statuses.map((s) => s.trim()).join("\n\n"),
            );
            setPesan("Utas disalin ke clipboard.");
            setBukaId(null);
          }}
          onBatal={() => setBukaId(null)}
        />
      ) : null}

      <ConfirmDialog
        open={konfirmasi !== null}
        judul={konfirmasi?.aksi === "hapus" ? "Hapus konten?" : "Arsipkan konten?"}
        pesan={
          konfirmasi?.aksi === "hapus"
            ? `“${konfirmasi?.judul}” akan dihapus permanen dari Pustaka. Tindakan ini tidak bisa dibatalkan.`
            : `“${konfirmasi?.judul}” akan dipindahkan ke arsip. Arsip lebih dari 90 hari bisa dibersihkan (K3).`
        }
        labelKonfirmasi={konfirmasi?.aksi === "hapus" ? "Hapus" : "Arsipkan"}
        onKonfirmasi={() => {
          if (!konfirmasi) return;
          if (konfirmasi.aksi === "hapus") {
            lakukan((list) => hapusKonten(list, konfirmasi.id));
            setPesan("Konten dihapus.");
          } else {
            lakukan((list) => arsipkanKonten(list, konfirmasi.id, true));
            setPesan("Konten diarsipkan.");
          }
          setKonfirmasi(null);
        }}
        onBatal={() => setKonfirmasi(null)}
      />

    </div>
  );
}
