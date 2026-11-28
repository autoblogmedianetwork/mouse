/**
 * Pengirim teks ke Threads API (Fase 7, ADR 0023) — jalur RESMI Meta.
 *
 * Dua langkah sesuai docs: buat container (media_type=TEXT) lalu publish.
 * Fungsi murni terhadap fetch (fetch disuntikkan lewat parameter supaya
 * bisa diuji unit tanpa jaringan).
 *
 * Batas: hanya teks ≤500 karakter (postingan utama). Kiriman selalu persis
 * teks yang dititipkan user — tidak ada pengubahan kata.
 */

const DASAR = "https://graph.threads.com/v1.0";

export type FungsiFetch = (url: string, init: RequestInit) => Promise<Response>;

export type HasilKirim =
  | { ok: true; postId: string }
  | { ok: false; galat: string; perluSambungUlang?: boolean };

/** Bangun body container TEXT — dipisah agar mudah diuji. */
export function bodyContainer(teks: string): URLSearchParams {
  return new URLSearchParams({ media_type: "TEXT", text: teks });
}

/**
 * Kirim satu teks. `terjemahkanGalat` dipisah agar test tidak tergantung
 * modul config yang membaca env.
 */
export async function kirimTeks(
  opsi: {
    accessToken: string;
    threadsUserId: string;
    teks: string;
    fetchImpl?: FungsiFetch;
    terjemahkanGalat?: (status: number, body: string) => string;
  },
): Promise<HasilKirim> {
  const f = opsi.fetchImpl ?? fetch;
  const terjemahkan = opsi.terjemahkanGalat ?? ((s, b) => `Gagal mengirim (${s}). ${b.slice(0, 120)}`);

  // Langkah 1: container
  const res1 = await f(`${DASAR}/${opsi.threadsUserId}/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${opsi.accessToken}`,
    },
    body: bodyContainer(opsi.teks).toString(),
  });
  if (!res1.ok) {
    const body = await res1.text();
    return { ok: false, galat: terjemahkan(res1.status, body), perluSambungUlang: res1.status === 401 };
  }
  const j1 = (await res1.json()) as { id?: string };
  if (!j1.id) return { ok: false, galat: "Threads tidak mengembalikan id container." };

  // Langkah 2: publish container
  const res2 = await f(`${DASAR}/${opsi.threadsUserId}/threads_publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${opsi.accessToken}`,
    },
    body: new URLSearchParams({ creation_id: j1.id }).toString(),
  });
  if (!res2.ok) {
    const body = await res2.text();
    return { ok: false, galat: terjemahkan(res2.status, body), perluSambungUlang: res2.status === 401 };
  }
  const j2 = (await res2.json()) as { id?: string };
  if (!j2.id) {
    // Container masih diproses — jarang untuk teks. Laporkan jelas, tidak
    // diulang otomatis supaya tidak dobel kirim.
    return { ok: false, galat: "Threads masih memproses kiriman (tanpa id). Periksa profil, jangan kirim ulang." };
  }
  return { ok: true, postId: j2.id };
}
