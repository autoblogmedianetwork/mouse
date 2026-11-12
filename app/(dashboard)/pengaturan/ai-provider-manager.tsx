"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/card";

interface Provider {
  id: string;
  nama: string;
  baseUrl: string;
  model: string;
  isActive: boolean;
}

const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";

export function AiProviderManager() {
  const [list, setList] = useState<Provider[]>([]);
  const [nama, setNama] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(false);

  const muat = async () => {
    try {
      const res = await fetch("/api/ai-provider");
      const json = (await res.json()) as { providers?: Provider[] };
      if (json.providers) setList(json.providers);
    } catch {
      // Biarkan daftar lama tampil; error simpan/tambah yang diberi pesan.
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void muat();
  }, []);

  const tambah = async () => {
    setGalat(null);
    if (!nama || !baseUrl || !model || !apiKey) {
      setGalat("Semua field wajib diisi.");
      return;
    }
    setMemuat(true);
    try {
      const res = await fetch("/api/ai-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, baseUrl, model, apiKey }),
      });
      // Server bisa membalas HTML (mis. 500 dari runtime), jadi jangan asumsikan JSON.
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setGalat(json.error ?? `Gagal menambah provider (HTTP ${res.status}).`);
        return;
      }
      setNama("");
      setBaseUrl("");
      setModel("");
      setApiKey("");
      await muat();
    } catch {
      setGalat("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setMemuat(false);
    }
  };

  const hapus = async (id: string) => {
    await fetch(`/api/ai-provider?id=${id}`, { method: "DELETE" });
    await muat();
  };

  const aktifkan = async (id: string) => {
    await fetch("/api/ai-provider/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await muat();
  };

  const [testing, setTesting] = useState<string | null>(null);
  const [hasilTest, setHasilTest] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editModel, setEditModel] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [sedangSimpan, setSedangSimpan] = useState(false);

  const bukaEdit = (p: Provider) => {
    setEditId(p.id);
    setEditNama(p.nama);
    setEditModel(p.model);
    setEditApiKey(""); // kunci lama dipertahankan bila dibiarkan kosong
    setGalat(null);
  };

  const simpanEdit = async () => {
    if (!editId) return;
    setSedangSimpan(true);
    setGalat(null);
    try {
      const res = await fetch("/api/ai-provider", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          nama: editNama,
          model: editModel,
          // Kosong = kunci lama dipertahankan (server tidak menuntut isi ulang).
          ...(editApiKey.trim() ? { apiKey: editApiKey } : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setGalat(json.error ?? `Gagal menyimpan (HTTP ${res.status}).`);
        return;
      }
      setEditId(null);
      await muat();
    } catch {
      setGalat("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setSedangSimpan(false);
    }
  };

  const nonaktifkan = async (id: string) => {
    await fetch("/api/ai-provider", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: false }),
    });
    await muat();
  };

  const tes = async (id: string) => {
    setTesting(id);
    const res = await fetch("/api/ai-provider/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    setHasilTest((prev) => ({ ...prev, [id]: json.ok ? "OK" : (json.error ?? "Gagal") }));
    setTesting(null);
  };

  return (
    <Card>
      <h2 className="text-isi font-semibold">Provider AI (tersimpan di server)</h2>
      <p className="mt-1 text-badan text-muted-foreground">
        Kunci API disimpan terenkripsi di server (AES-256-GCM). Tidak pernah tampil di browser.
      </p>

      <div className="mt-4 space-y-2">
        {list.length === 0 ? (
          <p className="text-meta text-muted-foreground">Belum ada provider tersimpan; pakai env server.</p>
        ) : (
          list.map((p, i) => (
            <div key={p.id} className="border border-surface-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-badan font-medium">
                    <span className="mr-2 font-mono text-meta text-muted-foreground">#{i + 1}</span>
                    {p.nama}{" "}
                    <span
                      className={
                        p.isActive
                          ? "ml-1 text-meta font-medium text-status-ready"
                          : "ml-1 text-meta text-muted-foreground"
                      }
                    >
                      {p.isActive ? "UTAMA · dicoba duluan" : "CADANGAN · dipakai kalau utama gagal"}
                    </span>
                  </p>
                  <p className="text-meta text-muted-foreground break-all">
                    {p.baseUrl} · {p.model}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => tes(p.id)} disabled={testing === p.id} className="border border-surface-border px-2 py-1 text-meta disabled:opacity-50">
                    {testing === p.id ? "Testing…" : "Test"}
                  </button>
                  <button type="button" onClick={() => bukaEdit(p)} className="border border-surface-border px-2 py-1 text-meta">
                    Edit
                  </button>
                  {p.isActive ? (
                    <button type="button" onClick={() => nonaktifkan(p.id)} className="border border-surface-border px-2 py-1 text-meta">
                      Nonaktifkan
                    </button>
                  ) : (
                    <button type="button" onClick={() => aktifkan(p.id)} className="border border-surface-border px-2 py-1 text-meta">
                      Aktifkan
                    </button>
                  )}
                  <button type="button" onClick={() => hapus(p.id)} className="border border-surface-border px-2 py-1 text-meta">
                    Hapus
                  </button>
                </div>
              </div>
              {editId === p.id ? (
                <div className="mt-3 space-y-2 border-t border-surface-border pt-3">
                  <input value={editNama} onChange={(e) => setEditNama(e.target.value)} placeholder="Nama provider" className={inputClass} />
                  <input value={editModel} onChange={(e) => setEditModel(e.target.value)} placeholder="Model" className={inputClass} />
                  <input
                    type="password"
                    value={editApiKey}
                    onChange={(e) => setEditApiKey(e.target.value)}
                    placeholder="API key baru — kosongkan bila tidak diganti"
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={simpanEdit} disabled={sedangSimpan} className="border border-surface-border px-3 py-1.5 text-meta disabled:opacity-50">
                      {sedangSimpan ? "Menyimpan…" : "Simpan perubahan"}
                    </button>
                    <button type="button" onClick={() => setEditId(null)} className="border border-surface-border px-3 py-1.5 text-meta">
                      Batal
                    </button>
                  </div>
                </div>
              ) : null}
              {hasilTest[p.id] ? (
                <p className="mt-1 text-meta text-muted-foreground">Hasil test: {hasilTest[p.id]}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
      {list.length > 0 ? (
        <p className="mt-3 text-meta text-muted-foreground">
          Urutan antrian: UTAMA dicoba duluan, lalu CADANGAN. Provider nonaktif tetap menjadi
          cadangan terakhir; env server (Vercel) adalah jaring paling akhir.
        </p>
      ) : null}

      <div className="mt-4 space-y-2 border-t border-surface-border pt-4">
        <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama provider" className={inputClass} />
        <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="Base URL (https://...)" className={inputClass} />
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" className={inputClass} />
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API key"
          className={inputClass}
        />
        {galat ? <p className="text-meta text-status-failed">{galat}</p> : null}
        <button
          type="button"
          onClick={tambah}
          disabled={memuat}
          className="border border-surface-border px-3 py-1.5 text-meta disabled:opacity-50"
        >
          {memuat ? "Menyimpan…" : "Tambah provider"}
        </button>
      </div>
    </Card>
  );
}
