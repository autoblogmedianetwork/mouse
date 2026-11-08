"use client";

/**
 * Jalur video "prompt manual" (docs/Workflow-Heaviliate.md §5):
 * data produk → prompt storyboard untuk ChatGPT → tempel JSON → prompt Google
 * Flow per scene → arsip draf.
 *
 * Tidak ada panggilan AI dari aplikasi dan tidak ada upload video. Semua teks
 * yang keluar hanya disalin user, jadi jalur ini tetap berjalan tanpa kunci AI.
 */

import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { FORMAT_LABELS } from "@/lib/ai/schemas";
import { salinKeClipboard } from "@/lib/konten/salin";
import { useLocalState } from "@/lib/konten/use-local-state";
import { susunPromptStoryboard } from "@/lib/video/prompt-storyboard";
import { LANGKAH_PROMPT_CEPAT, susunPromptCepat } from "@/lib/video/prompt-cepat";
import { GAYA_FLOW, susunPromptFlowScene, susunSemuaPromptFlow } from "@/lib/video/prompt-flow";
import {
  JUMLAH_SCENE_MAX,
  JUMLAH_SCENE_MIN,
  validasiStoryboard,
  type SceneStoryboard,
} from "@/lib/video/storyboard";
import {
  CHECKLIST_AWAL,
  CHECKLIST_IDS,
  LABEL_CHECKLIST,
  checklistVideoLengkap,
  hapusVideo,
  muatVideo,
  simpanVideo,
  type ChecklistVideo,
  type VideoTersimpan,
} from "@/lib/video/store";

const KUNCI_DRAF = "autothreads-video-draf";

type Mode = "json" | "cepat";

interface DrafVideo {
  mode: Mode;
  namaProduk: string;
  varian: string;
  ringkasan: string;
  adaFoto: boolean;
  angleJudul: string;
  angleFormat: (typeof FORMAT_LABELS)[number];
  hook: string;
  durasiDetik: number;
  jumlahScene: number;
  gayaVisual: string;
  instruksiTambahan: string;
  storyboardTeks: string;
  checkpoint1: boolean;
  linkVideo: string;
  checklist: Record<ChecklistVideo, boolean>;
}

const DRAF_AWAL: DrafVideo = {
  mode: "json",
  namaProduk: "",
  varian: "",
  ringkasan: "",
  adaFoto: true,
  angleJudul: "",
  angleFormat: "Problem-Solution",
  hook: "",
  durasiDetik: 10,
  jumlahScene: 3,
  gayaVisual: GAYA_FLOW[0],
  instruksiTambahan: "",
  storyboardTeks: "",
  checkpoint1: false,
  linkVideo: "",
  checklist: CHECKLIST_AWAL,
};

const primaryBtn =
  "inline-flex h-10 items-center bg-primary px-5 text-badan font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";
const inputCls =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";
const labelCls = "mb-1 block text-meta font-mono uppercase tracking-meta text-muted-foreground";
const preCls =
  "max-h-72 overflow-auto border border-surface-border bg-muted/40 p-3 font-mono text-meta whitespace-pre-wrap";

export function AlurVideo() {
  const [draf, setDraf] = useLocalState<DrafVideo>(KUNCI_DRAF, DRAF_AWAL);
  const [arsip, setArsip] = useState<VideoTersimpan[]>(() =>
    typeof window === "undefined" ? [] : muatVideo(),
  );
  const [pesan, setPesan] = useState<string | null>(null);

  const ubah = (patch: Partial<DrafVideo>) => setDraf((prev) => ({ ...prev, ...patch }));

  const promptStoryboard = useMemo(
    () =>
      susunPromptStoryboard({
        namaProduk: draf.namaProduk,
        varian: draf.varian,
        ringkasan: draf.ringkasan,
        adaFoto: draf.adaFoto,
        angleJudul: draf.angleJudul,
        angleFormat: draf.angleFormat,
        hook: draf.hook,
        durasiDetik: draf.durasiDetik,
        jumlahScene: draf.jumlahScene,
        instruksiTambahan: draf.instruksiTambahan,
      }),
    [draf],
  );

  // Validasi hanya jalan setelah ada tempelan, supaya tidak ada galat merah
  // pada halaman yang baru dibuka.
  const validasi = useMemo(
    () => (draf.storyboardTeks.trim() ? validasiStoryboard(draf.storyboardTeks) : null),
    [draf.storyboardTeks],
  );

  const storyboard = validasi?.ok ? validasi.storyboard : null;

  const opsiFlow = useMemo(
    () => ({
      namaProduk: draf.namaProduk,
      varian: draf.varian,
      gaya: draf.gayaVisual,
      instruksiTambahan: draf.instruksiTambahan,
    }),
    [draf.namaProduk, draf.varian, draf.gayaVisual, draf.instruksiTambahan],
  );

  const semuaPromptFlow = useMemo(
    () => (storyboard ? susunSemuaPromptFlow(storyboard, opsiFlow) : ""),
    [storyboard, opsiFlow],
  );

  // Mode cepat: satu prompt panjang gaya Gemini Omni, tanpa storyboard JSON.
  const promptCepat = useMemo(
    () =>
      susunPromptCepat({
        namaProduk: draf.namaProduk,
        varian: draf.varian,
        deskripsi: draf.ringkasan,
        durasiDetik: draf.durasiDetik,
        jumlahScene: draf.jumlahScene,
        instruksiTambahan: draf.instruksiTambahan,
      }),
    [draf.namaProduk, draf.varian, draf.ringkasan, draf.durasiDetik, draf.jumlahScene, draf.instruksiTambahan],
  );

  const salin = async (teks: string, label: string) => {
    const berhasil = await salinKeClipboard(teks);
    setPesan(
      berhasil
        ? `${label} disalin. Tempel di tempat tujuan.`
        : "Gagal menyalin. Izinkan akses clipboard lalu coba lagi.",
    );
  };

  const simpan = () => {
    if (!storyboard) return;
    const sekarang = new Date().toISOString();
    const judul = `${draf.namaProduk.trim() || "Video"} — ${draf.angleJudul.trim() || "Storyboard"}`;
    const entry: VideoTersimpan = {
      id: crypto.randomUUID(),
      judul,
      nama_produk: draf.namaProduk.trim(),
      storyboard,
      link_video: draf.linkVideo.trim(),
      checklist: draf.checklist,
      status: "draft",
      created_at: sekarang,
      updated_at: sekarang,
    };
    setArsip(simpanVideo(arsip, entry));
    setPesan(`"${judul}" disimpan sebagai draft di arsip video.`);
  };

  const hapus = (id: string) => {
    setArsip(hapusVideo(arsip, id));
    setPesan("Entri video dihapus dari arsip.");
  };

  const bisaSalinFlow = Boolean(storyboard) && draf.checkpoint1;

  return (
    <div className="space-y-6">
      {pesan ? (
        <p role="status" className="border border-status-ready/40 bg-status-ready/10 px-4 py-2 text-badan font-mono">
          {pesan}
        </p>
      ) : null}

      <nav aria-label="Mode alur video" className="flex flex-wrap gap-2">
        {(
          [
            { id: "json", label: "Mode JSON (diperiksa)" },
            { id: "cepat", label: "Mode cepat (satu prompt)" },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => ubah({ mode: m.id })}
            aria-pressed={draf.mode === m.id}
            className={
              draf.mode === m.id
                ? "border border-primary bg-primary px-3 py-1.5 font-mono text-meta font-semibold text-primary-foreground"
                : "border border-surface-border bg-surface px-3 py-1.5 font-mono text-meta hover:bg-muted"
            }
          >
            {m.label}
          </button>
        ))}
      </nav>

      {/* ------------------------------ 1. Data produk ----------------------------- */}
      <Card>
        <h2 className="text-isi font-semibold">1. Data produk</h2>
        <p className="mt-1 text-badan text-muted-foreground">
          Data ini hanya dipakai untuk menyusun teks prompt. Foto produk tidak diunggah ke mana pun.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="video-nama" className={labelCls}>
              Nama produk
            </label>
            <input
              id="video-nama"
              value={draf.namaProduk}
              onChange={(e) => ubah({ namaProduk: e.target.value })}
              placeholder="Rice Cooker Miyako 1,8 L"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="video-varian" className={labelCls}>
              Varian
            </label>
            <input
              id="video-varian"
              value={draf.varian}
              onChange={(e) => ubah({ varian: e.target.value })}
              placeholder="Putih, 1,8 liter"
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="video-ringkasan" className={labelCls}>
            Ringkasan hasil analisis (bahan utama storyboard)
          </label>
          <textarea
            id="video-ringkasan"
            rows={3}
            value={draf.ringkasan}
            onChange={(e) => ubah({ ringkasan: e.target.value })}
            placeholder="Kapasitas 1,8 liter, mode warm sampai 12 jam, harga Rp189.000."
            className={inputCls}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="video-angle" className={labelCls}>
              Judul angle
            </label>
            <input
              id="video-angle"
              value={draf.angleJudul}
              onChange={(e) => ubah({ angleJudul: e.target.value })}
              placeholder="Nasi hangat sepanjang hari"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="video-format" className={labelCls}>
              Format
            </label>
            <select
              id="video-format"
              value={draf.angleFormat}
              onChange={(e) => ubah({ angleFormat: e.target.value as DrafVideo["angleFormat"] })}
              className={inputCls}
            >
              {FORMAT_LABELS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="video-gaya" className={labelCls}>
              Gaya visual (untuk Flow)
            </label>
            <select
              id="video-gaya"
              value={draf.gayaVisual}
              onChange={(e) => ubah({ gayaVisual: e.target.value })}
              className={inputCls}
            >
              {GAYA_FLOW.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="video-hook" className={labelCls}>
              Hook (3 detik pertama)
            </label>
            <input
              id="video-hook"
              value={draf.hook}
              onChange={(e) => ubah({ hook: e.target.value })}
              placeholder="Nasi cepat dingin?"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="video-durasi" className={labelCls}>
              Durasi total (detik)
            </label>
            <input
              id="video-durasi"
              type="number"
              min={5}
              max={15}
              value={draf.durasiDetik}
              onChange={(e) => ubah({ durasiDetik: Number(e.target.value) || 10 })}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="video-scene" className={labelCls}>
              Jumlah scene ({JUMLAH_SCENE_MIN}–{JUMLAH_SCENE_MAX})
            </label>
            <input
              id="video-scene"
              type="number"
              min={JUMLAH_SCENE_MIN}
              max={JUMLAH_SCENE_MAX}
              value={draf.jumlahScene}
              onChange={(e) => ubah({ jumlahScene: Number(e.target.value) || JUMLAH_SCENE_MIN })}
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="video-instruksi" className={labelCls}>
            Instruksi tambahan
          </label>
          <input
            id="video-instruksi"
            value={draf.instruksiTambahan}
            onChange={(e) => ubah({ instruksiTambahan: e.target.value })}
            placeholder="Tanpa wajah orang, latar dapur kayu"
            className={inputCls}
          />
        </div>

        <label className="mt-4 flex items-center gap-2 text-badan">
          <input
            type="checkbox"
            checked={draf.adaFoto}
            onChange={(e) => ubah({ adaFoto: e.target.checked })}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Saya punya foto produk sebagai referensi visual
        </label>
      </Card>

      {draf.mode === "json" ? (
        <>
      {/* --------------------------- 2. Prompt ChatGPT ---------------------------- */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-isi font-semibold">2. Prompt storyboard untuk ChatGPT</h2>
            <p className="mt-1 text-badan text-muted-foreground">
              Salin, tempel di ChatGPT, lalu minta ia membalas hanya JSON. Tidak ada biaya AI dari
              aplikasi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => salin(promptStoryboard, "Prompt storyboard")}
            className={primaryBtn}
          >
            Salin prompt
          </button>
        </div>
        <pre className={`mt-4 ${preCls}`}>{promptStoryboard}</pre>
      </Card>

      {/* ------------------------- 3. Tempel JSON + checkpoint 1 ------------------- */}
      <Card>
        <h2 className="text-isi font-semibold">3. Tempel JSON storyboard</h2>
        <p className="mt-1 text-badan text-muted-foreground">
          Tempel balasan ChatGPT di sini. Sistem hanya memeriksa bentuk JSON — klaim tetap Anda yang
          menilai.
        </p>
        <textarea
          rows={10}
          value={draf.storyboardTeks}
          onChange={(e) => ubah({ storyboardTeks: e.target.value })}
          placeholder='{"durasi_total_detik": 10, "scenes": [ ... ]}'
          className={`mt-3 ${inputCls} font-mono text-meta`}
          aria-label="JSON storyboard"
        />

        {validasi && !validasi.ok ? (
          <p className="mt-3 border border-status-failed/40 bg-status-failed/10 p-3 text-badan font-mono">
            ! GALAT: {validasi.error}
          </p>
        ) : null}

        {validasi?.ok ? (
          <div className="mt-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-meta">
                <thead>
                  <tr className="border-b-2 border-foreground text-left font-mono uppercase tracking-meta">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Detik</th>
                    <th className="py-2 pr-3">Visual</th>
                    <th className="py-2 pr-3">Kamera</th>
                    <th className="py-2 pr-3">Teks layar</th>
                    <th className="py-2">Narasi</th>
                  </tr>
                </thead>
                <tbody>
                  {validasi.storyboard.scenes.map((scene) => (
                    <tr key={scene.urutan} className="border-b border-surface-border align-top">
                      <td className="py-2 pr-3 font-mono">{scene.urutan}</td>
                      <td className="py-2 pr-3 font-mono">{scene.durasi_detik}</td>
                      <td className="py-2 pr-3">{scene.visual}</td>
                      <td className="py-2 pr-3">{scene.gerakan_kamera}</td>
                      <td className="py-2 pr-3">{scene.teks_layar || "—"}</td>
                      <td className="py-2">{scene.narasi ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-meta font-mono text-muted-foreground">
              Total {validasi.storyboard.scenes.reduce((s, sc) => s + sc.durasi_detik, 0)} detik ·{" "}
              {validasi.storyboard.scenes.length} scene · rasio {validasi.storyboard.rasio}
            </p>

            {validasi.peringatan.length > 0 ? (
              <ul className="space-y-1 border border-warning/40 bg-warning/10 p-3 text-meta">
                {validasi.peringatan.map((p) => (
                  <li key={p}>- {p}</li>
                ))}
              </ul>
            ) : null}

            <label className="flex items-start gap-2 border border-surface-border p-3 text-badan">
              <input
                type="checkbox"
                checked={draf.checkpoint1}
                onChange={(e) => ubah({ checkpoint1: e.target.checked })}
                className="mt-1 h-4 w-4 accent-[var(--primary)]"
              />
              <span>
                <strong>Checkpoint 1 selesai:</strong> durasi, teks layar, dan klaim sudah saya
                periksa. Buka prompt Flow di langkah 4.
              </span>
            </label>
          </div>
        ) : null}
      </Card>

      {/* --------------------------- 4. Prompt Google Flow ------------------------- */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-isi font-semibold">4. Prompt Google Flow per scene</h2>
            <p className="mt-1 text-badan text-muted-foreground">
              Tempel satu prompt per scene di Flow. Jangan gabungkan semua scene dalam satu klip.
            </p>
          </div>
          <button
            type="button"
            onClick={() => salin(semuaPromptFlow, "Semua prompt scene")}
            disabled={!bisaSalinFlow}
            className={primaryBtn}
          >
            Salin semua prompt
          </button>
        </div>

        {!storyboard ? (
          <div className="mt-4">
            <EmptyState
              title="Storyboard belum siap"
              description="Tempel JSON storyboard yang valid di langkah 3. Prompt Flow disusun dari scene di JSON itu."
            />
          </div>
        ) : !draf.checkpoint1 ? (
          <p className="mt-4 border border-warning/40 bg-warning/10 p-3 text-badan">
            Selesaikan checkpoint 1 di langkah 3 dulu. Tombol salin baru aktif setelah storyboard
            Anda periksa.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {storyboard.scenes.map((scene) => (
              <ScenePrompt
                key={scene.urutan}
                scene={scene}
                teks={susunPromptFlowScene(scene, opsiFlow)}
                onSalin={() =>
                  salin(
                    susunPromptFlowScene(scene, opsiFlow),
                    `Prompt scene ${scene.urutan}`,
                  )
                }
              />
            ))}
          </div>
        )}
      </Card>

      {/* ------------------------- 5. Checkpoint 2 + arsip ------------------------- */}
      <Card>
        <h2 className="text-isi font-semibold">5. Hasil video dan arsip</h2>
        <p className="mt-1 text-badan text-muted-foreground">
          Bandingkan tiap klip dengan foto asli sebelum disimpan. Video tetap diproses di Google Flow.
        </p>

        <ul className="mt-4 space-y-2">
          {CHECKLIST_IDS.map((id) => (
            <li key={id}>
              <label className="flex items-start gap-2 text-badan">
                <input
                  type="checkbox"
                  checked={draf.checklist[id] ?? false}
                  onChange={(e) =>
                    ubah({ checklist: { ...draf.checklist, [id]: e.target.checked } })
                  }
                  className="mt-1 h-4 w-4 accent-[var(--primary)]"
                />
                {LABEL_CHECKLIST[id]}
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <label htmlFor="video-link" className={labelCls}>
            Link video hasil Flow (opsional)
          </label>
          <input
            id="video-link"
            value={draf.linkVideo}
            onChange={(e) => ubah({ linkVideo: e.target.value })}
            placeholder="https://…"
            className={inputCls}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={simpan}
            disabled={!storyboard || !checklistVideoLengkap(draf.checklist)}
            className={primaryBtn}
          >
            Simpan sebagai draft
          </button>
          <span className="text-meta text-muted-foreground">
            {!storyboard
              ? "Butuh storyboard valid."
              : checklistVideoLengkap(draf.checklist)
                ? "Checklist lengkap."
                : "Lengkapi checklist dulu."}
          </span>
        </div>
      </Card>

      <Card>
        <h2 className="text-isi font-semibold">Arsip video ({arsip.length})</h2>
        {arsip.length === 0 ? (
          <p className="mt-2 text-badan text-muted-foreground">
            Belum ada draf video tersimpan. Semua entri di sini berstatus draft.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {arsip.map((v) => (
              <li key={v.id} className="border border-surface-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-badan font-semibold">{v.judul}</p>
                    <p className="text-meta font-mono text-muted-foreground">
                      [ DRAFT ] · {v.storyboard.scenes.length} scene ·{" "}
                      {new Date(v.created_at).toLocaleString("id-ID")}
                    </p>
                    {v.link_video ? (
                      <a
                        href={v.link_video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-meta underline underline-offset-2"
                      >
                        Buka video
                      </a>
                    ) : (
                      <p className="text-meta text-muted-foreground">Tanpa link video.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => hapus(v.id)}
                    className="text-meta uppercase underline-offset-2 hover:underline"
                  >
                    [ Hapus ]
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
        </>
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-isi font-semibold">Prompt cepat (Gemini Omni di Google Flow)</h2>
                <p className="mt-1 text-badan text-muted-foreground">
                  Satu prompt panjang: storyboard, audio, larangan ikon keranjang, tanpa orang.
                  Tidak ada storyboard JSON yang diperiksa, jadi tidak ada checkpoint 1.
                </p>
              </div>
              <button
                type="button"
                onClick={() => salin(promptCepat, "Prompt cepat")}
                className={primaryBtn}
              >
                Salin prompt
              </button>
            </div>
            <pre className={`mt-4 ${preCls}`}>{promptCepat}</pre>
          </Card>

          <Card>
            <h2 className="text-isi font-semibold">Langkah selanjutnya</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-badan">
              {LANGKAH_PROMPT_CEPAT.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ol>
            <p className="mt-4 border border-warning/40 bg-warning/10 p-3 text-meta">
              Mode cepat tidak menyimpan storyboard dan tidak memeriksa klaim. Untuk video yang perlu
              diperiksa lebih dulu, pakai mode JSON.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

function ScenePrompt({
  scene,
  teks,
  onSalin,
}: {
  scene: SceneStoryboard;
  teks: string;
  onSalin: () => void;
}) {
  return (
    <div className="border border-surface-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border bg-muted/40 px-3 py-2">
        <p className="font-mono text-meta font-semibold uppercase tracking-meta">
          Scene {scene.urutan} · {scene.durasi_detik} dtk
        </p>
        <button
          type="button"
          onClick={onSalin}
          className="h-8 border border-foreground bg-surface px-3 text-meta font-mono uppercase hover:bg-muted"
        >
          Salin scene {scene.urutan}
        </button>
      </div>
      <pre className={`${preCls} border-0`}>{teks}</pre>
    </div>
  );
}
