/**
 * Kotak — satu helper localStorage untuk seluruh Heaviliate (refactor R1).
 *
 * Sebelumnya 8 store menulis pola yang sama berulang: cek `window`,
 * try/catch JSON.parse, validasi per entri, try/catch setItem. Perbedaan
 * kecil antar salinan membuat bug storage harus diperbaiki di banyak tempat.
 *
 * Aturan perilaku yang dipertahankan (jangan berubah):
 * - SSR aman: di server selalu nilai default, tidak menyentuh localStorage.
 * - Muat toleran: entri yang gagal validasi dibuang, bukan crash.
 * - Simpan senyap: storage penuh/diblokir tidak melempar error.
 */

/** Baca dan validasi satu nilai dari localStorage. */
export function bacaJson<T>(kunci: string, validasi: (nilai: unknown) => T | null, bawaan: T): T {
  if (typeof window === "undefined") return bawaan;
  try {
    const mentah = window.localStorage.getItem(kunci);
    if (!mentah) return bawaan;
    return validasi(JSON.parse(mentah) as unknown) ?? bawaan;
  } catch {
    return bawaan;
  }
}

/**
 * Baca daftar dari localStorage; entri yang gagal validasi dibuang.
 * `validasiSatu` mengembalikan null untuk entri yang ditolak.
 */
export function bacaDaftar<T>(
  kunci: string,
  validasiSatu: (entri: unknown) => T | null,
): T[] {
  return bacaJson<unknown[]>(kunci, (nilai) => (Array.isArray(nilai) ? nilai : null), []).flatMap(
    (entri) => {
      const hasil = validasiSatu(entri);
      return hasil === null ? [] : [hasil];
    },
  );
}

/** Simpan nilai apa pun ke localStorage secara senyap (tanpa melempar). */
export function tulisJson(kunci: string, nilai: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    // storage penuh/di-block: abaikan, state tetap di memori
  }
}

/** Hapus satu kunci secara senyap. */
export function hapusKunci(kunci: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(kunci);
  } catch {
    // abaikan
  }
}

/** Baca satu objek dan validasi dengan skema Zod; gagal = nilai bawaan. */
export function bacaSkema<T>(
  kunci: string,
  skema: { safeParse: (nilai: unknown) => { success: boolean; data?: T } },
  bawaan: T,
): T {
  return bacaJson<T>(
    kunci,
    (nilai) => {
      const hasil = skema.safeParse(nilai);
      return hasil.success && hasil.data !== undefined ? hasil.data : null;
    },
    bawaan,
  );
}

/**
 * Simpan dengan laporan hasil — untuk store yang menampilkan pesan ke UI
 * bila kuota localStorage habis. Berbeda dari tulisJson yang senyap.
 */
export function tulisJsonHasil(
  kunci: string,
  nilai: unknown,
  pesanGagal: string,
): { ok: boolean; pesan: string } {
  if (typeof window === "undefined") {
    return { ok: false, pesan: "Penyimpanan hanya tersedia di peramban." };
  }
  try {
    window.localStorage.setItem(kunci, JSON.stringify(nilai));
    return { ok: true, pesan: "" };
  } catch {
    return { ok: false, pesan: pesanGagal };
  }
}
