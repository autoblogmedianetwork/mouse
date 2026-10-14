"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isAvailable, pilihSuaraIndonesia, teksUntukDibaca } from "@/lib/media/suara-browser";

/** Tidak ada perubahan setelah mount; hook ini hanya menjembatani server dan klien. */
function subscribeTanpaPerubahan() {
  return () => {};
}

/**
 * Preview suara narasi (N-6). Tombol hanya muncul kalau browser mendukung
 * Web Speech API. Tidak ada kunci API dan tidak ada panggilan jaringan; ini
 * hanya pembacaan cepat di perangkat user, bukan pengganti TTS provider.
 */
export function TombolSuaraNarasi({ statuses }: { statuses: string[] }) {
  // Dukungan browser dibaca setelah hidrasi supaya markup server dan klien sama.
  const bisa = useSyncExternalStore(subscribeTanpaPerubahan, isAvailable, () => false);
  const [berjalan, setBerjalan] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!bisa) return null;

  const teks = teksUntukDibaca(statuses);
  const kosong = teks.length === 0;

  const putar = () => {
    if (kosong) return;
    const synth = window.speechSynthesis;
    synth.cancel();

    const daftar = synth.getVoices();
    const pilihan = pilihSuaraIndonesia(daftar.map((v) => ({ nama: v.name, lang: v.lang })));
    const suara = pilihan ? daftar.find((v) => v.name === pilihan.nama) : undefined;

    const utterance = new SpeechSynthesisUtterance(teks);
    if (suara) utterance.voice = suara;
    utterance.lang = pilihan?.lang ?? "id-ID";
    utterance.onend = () => setBerjalan(false);
    utterance.onerror = () => setBerjalan(false);

    setBerjalan(true);
    synth.speak(utterance);
  };

  const hentikan = () => {
    window.speechSynthesis.cancel();
    setBerjalan(false);
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={berjalan ? hentikan : putar}
        disabled={kosong}
        className="h-9 rounded-lg border border-surface-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
      >
        {berjalan ? "Hentikan suara" : "Putar suara narasi"}
      </button>
      <span className="text-xs text-muted-foreground">
        Preview cepat di browser (Web Speech API), bukan pengganti TTS provider.
      </span>
    </div>
  );
}
