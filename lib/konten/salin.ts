/**
 * Salin utas (N-4): satu tempat untuk menyusun teks yang disalin dan satu
 * cara menyalinnya. Dipakai tombol salin per status dan "Salin utas lengkap"
 * supaya urutan teks tidak berbeda antar tombol.
 *
 * Clipboard API hanya jalan di browser dan harus dipicu aksi user. Kalau
 * browser menolak atau API tidak ada, helper mengembalikan false supaya UI
 * bisa menyuruh user menyalin manual (teksnya tetap terlihat di layar).
 */

/** Teks satu status yang siap ditempel: spasi di ujung dibuang. */
export function teksStatus(status: string): string {
  return status.trim();
}

/**
 * Teks utas lengkap: status terisi dipisah satu baris kosong, sesuai
 * tempelan manual ke Threads. Status kosong dilewati, bukan digabung.
 */
export function teksUtasLengkap(statuses: string[]): string {
  return statuses
    .map(teksStatus)
    .filter((s) => s.length > 0)
    .join("\n\n");
}

/** Clipboard tersedia dan halaman punya konteks aman (https atau localhost). */
export function clipboardTersedia(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.clipboard?.writeText);
}

/**
 * Menyalin teks ke clipboard. Fallback ke textarea sementara hanya dipakai
 * kalau Clipboard API tidak tersedia; tidak ada kunci API atau jaringan.
 */
export async function salinKeClipboard(teks: string): Promise<boolean> {
  if (teks.length === 0) return false;

  if (clipboardTersedia()) {
    try {
      await navigator.clipboard.writeText(teks);
      return true;
    } catch {
      // jatuh ke fallback di bawah
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const area = document.createElement("textarea");
    area.value = teks;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const berhasil = document.execCommand("copy");
    document.body.removeChild(area);
    return berhasil;
  } catch {
    return false;
  }
}
