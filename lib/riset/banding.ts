/**
 * Bandingkan dua niche (power-up Riset, Gelombang 4).
 *
 * Snapshot peluang per niche disimpan di localStorage (maks 2). Fungsi murni
 * menyusun perbandingan; UI hanya menampilkan hasilnya.
 */

export const KEY_BANDING = "autothreads-riset-banding";
export const MAKS_SNAPSHOT = 2;

export interface PeluangRingkas {
  kategori: string;
  skor_total: number | null;
  direkomendasikan: boolean;
}

export interface SnapshotRiset {
  niche: string;
  tanggal: string;
  jumlah: number;
  /** Rata-rata skor_total, dibulatkan 1 desimal; null kalau tak ada skor. */
  skorRata: number | null;
  jumlahDirekomendasikan: number;
  /** Tiga peluang teratas berdasarkan skor_total. */
  teratas: string[];
}

export function buatSnapshot(
  niche: string,
  peluang: readonly PeluangRingkas[],
  tanggal = new Date().toISOString(),
): SnapshotRiset {
  const berskor = peluang.filter((p) => typeof p.skor_total === "number");
  const skorRata =
    berskor.length > 0
      ? Math.round(
          (berskor.reduce((a, p) => a + (p.skor_total as number), 0) / berskor.length) * 10,
        ) / 10
      : null;
  const teratas = [...peluang]
    .filter((p) => typeof p.skor_total === "number")
    .sort((a, b) => (b.skor_total as number) - (a.skor_total as number))
    .slice(0, 3)
    .map((p) => p.kategori);
  return {
    niche: niche.trim(),
    tanggal,
    jumlah: peluang.length,
    skorRata,
    jumlahDirekomendasikan: peluang.filter((p) => p.direkomendasikan).length,
    teratas,
  };
}

/** Simpan snapshot ke daftar (maks 2): niche sama ditimpa, baru masuk depan. */
export function simpanSnapshot(
  list: readonly SnapshotRiset[],
  snapshot: SnapshotRiset,
): SnapshotRiset[] {
  const sisa = list.filter(
    (s) => s.niche.trim().toLowerCase() !== snapshot.niche.trim().toLowerCase(),
  );
  return [snapshot, ...sisa].slice(0, MAKS_SNAPSHOT);
}

export interface HasilBanding {
  baris: string[];
  /** Niche pemenang berdasar skor rata-rata; null kalau seri/data tipis. */
  pemenang: string | null;
}

/** Bandingkan dua snapshot; butuh keduanya punya skor. */
export function bandingkanDua(a: SnapshotRiset, b: SnapshotRiset): HasilBanding {
  const baris: string[] = [];
  let adaPerbandingan = false;
  let pemenang: string | null = null;

  if (a.skorRata !== null && b.skorRata !== null && a.skorRata !== b.skorRata) {
    const juara = a.skorRata > b.skorRata ? a : b;
    const selisih = Math.abs(a.skorRata - b.skorRata).toFixed(1);
    pemenang = juara.niche;
    adaPerbandingan = true;
    baris.push(
      `"${juara.niche}" menang skor rata-rata (${juara.skorRata} vs ${juara === a ? b.skorRata : a.skorRata}, selisih ${selisih}).`,
    );
  }

  if (a.jumlahDirekomendasikan !== b.jumlahDirekomendasikan) {
    const juara = a.jumlahDirekomendasikan > b.jumlahDirekomendasikan ? a : b;
    adaPerbandingan = true;
    baris.push(
      `"${juara.niche}" punya ${juara.jumlahDirekomendasikan} peluang layak duluan (vs ${juara === a ? b.jumlahDirekomendasikan : a.jumlahDirekomendasikan}).`,
    );
  }

  for (const satu of [a, b]) {
    if (satu.teratas[0]) {
      baris.push(`Teratas "${satu.niche}": ${satu.teratas.join(", ")}.`);
    }
  }

  if (!adaPerbandingan) {
    baris.push("Kedua niche setara — pilih yang paling Anda kuasai.");
  }
  return { baris, pemenang };
}
