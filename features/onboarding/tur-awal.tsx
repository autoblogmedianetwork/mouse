"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  buatProdukContoh,
  onboardingSelesai,
  siapkanDraftProdukContoh,
  tandaiOnboardingSelesai,
} from "./produk-contoh";

/**
 * TurAwal — tur 3 langkah untuk pemula, tampil sekali saat pertama membuka
 * dashboard (flag localStorage, Fase 1 task C). Bahasa sehari-hari tanpa
 * jargon; setiap cara keluar menandai selesai supaya tidak menyebalkan.
 * Pola dialog native mengikuti ConfirmDialog (fokus terjebak, Esc aman).
 */
export function TurAwal() {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [langkah, setLangkah] = useState(1);
  // Belum tahu status flag sampai jalan di klien: render kosong dulu agar
  // tidak hydration mismatch.
  const [siap, setSiap] = useState(false);
  const [terbuka, setTerbuka] = useState(false);

  useEffect(() => {
    if (!onboardingSelesai()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- flag localStorage hanya bisa dibaca setelah mount; init langsung di useState bikin hydration mismatch (pola sama dengan alur-buat-posting.tsx)
      setTerbuka(true);
    }
    setSiap(true);
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (terbuka && !dialog.open) dialog.showModal();
    if (!terbuka && dialog.open) dialog.close();
  }, [terbuka]);

  if (!siap) return null;

  const selesai = () => {
    tandaiOnboardingSelesai();
    setTerbuka(false);
  };

  const cobaProdukContoh = () => {
    siapkanDraftProdukContoh(buatProdukContoh());
    selesai();
    router.push("/posting/baru");
  };

  const isiSendiri = () => {
    selesai();
    router.push("/posting/baru");
  };

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        selesai();
      }}
      className="m-auto max-w-md border-2 border-foreground bg-surface p-6 text-foreground backdrop:bg-black/60"
    >
      {langkah === 1 ? (
        <div>
          <h2 className="text-isi font-bold uppercase">Selamat datang di Heaviliate</h2>
          <p className="mt-3 text-badan">
            Aplikasi ini mengubah produk yang kamu promosikan menjadi konten siap posting.
            Semua hasil AI selalu berstatus <strong>draft</strong> — tidak ada yang dikirim
            sebelum kamu membaca dan menyetujuinya.
          </p>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setLangkah(2)}
              className="h-9 border-2 border-foreground bg-primary px-4 text-badan font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Lanjut
            </button>
          </div>
        </div>
      ) : langkah === 2 ? (
        <div>
          <h2 className="text-isi font-bold uppercase">Cara kerjanya 4 langkah</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-badan">
            <li>Isi produk — tempel deskripsi dari toko online.</li>
            <li>AI membaca produk lalu memberi ringkasan dan ide konten.</li>
            <li>AI menulis konten; kamu mengedit sampai puas.</li>
            <li>Centang checklist wajib, lalu salin atau kirim.</li>
          </ol>
          <div className="mt-5 flex justify-between">
            <button
              type="button"
              onClick={() => setLangkah(1)}
              className="h-9 border border-surface-border px-4 text-badan hover:border-primary"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => setLangkah(3)}
              className="h-9 border-2 border-foreground bg-primary px-4 text-badan font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Lanjut
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-isi font-bold uppercase">Mau coba yang mana dulu?</h2>
          <p className="mt-3 text-badan">
            Paling cepat: pakai produk contoh supaya kamu lihat hasilnya dulu sebelum
            mengisi produk sendiri.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={cobaProdukContoh}
              className="h-11 border-2 border-foreground bg-primary px-4 text-badan font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Coba dengan produk contoh &gt;&gt;&gt;
            </button>
            <button
              type="button"
              onClick={isiSendiri}
              className="h-9 border-2 border-foreground bg-surface px-4 text-badan font-medium hover:border-primary"
            >
              Isi produk saya sendiri
            </button>
            <button
              type="button"
              onClick={selesai}
              className="h-9 px-4 text-meta text-muted-foreground underline-offset-2 hover:underline"
            >
              Jelajahi dulu
            </button>
          </div>
        </div>
      )}
      <p className="mt-4 text-meta text-muted-foreground">
        Langkah {langkah} dari 3
      </p>
    </dialog>
  );
}
