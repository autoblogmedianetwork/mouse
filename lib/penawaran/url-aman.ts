/**
 * Pengambil HTML dengan pengaman SSRF untuk /api/penawaran/ambil-meta.
 *
 * Masalah sebelumnya: route menerima URL apa pun lalu mem-fetch dari server.
 * Di Vercel itu berarti siapa pun bisa menyuruh server membuka
 * http://169.254.169.254/ (metadata cloud), localhost, atau IP privat jaringan
 * internal, lalu membaca hasilnya lewat respons JSON.
 *
 * Penjagaan di sini berlapis:
 *   1. Hanya http/https, tanpa kredensial di URL, port 80/443 saja.
 *   2. Hostname di-resolve, semua alamat hasil resolve harus IP publik.
 *   3. Redirect diikuti manual (maks 3) dan setiap tujuan divalidasi ulang,
 *      jadi redirect ke IP privat tetap ditolak.
 *   4. Ukuran respons dibatasi dan total waktu 8 detik.
 *
 * Sisa risiko yang diketahui: DNS rebinding di antara resolve dan fetch tidak
 * ditutup di sini karena butuh dispatcher undici kustom. Untuk pemakaian
 * pribadi satu pengguna, lapisan di atas sudah menutup kasus nyata.
 */
import { lookup } from "node:dns/promises";

export const MAKS_REDIRECT = 3;
export const MAKS_BYTES = 512 * 1024;
export const BATAS_WAKTU_MS = 8000;

const PORT_DIIZINKAN = new Set(["", "80", "443"]);

/** Alamat yang tidak boleh dijangkau server (IPv4, IPv6, dan bentuk mapped). */
export function ipPrivat(alamat: string): boolean {
  const ip = alamat.trim().toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  if (!ip) return true;

  // ::ffff:127.0.0.1 (bentuk titik) dan ::ffff:7f00:1 (bentuk heksadesimal).
  const mappedTitik = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mappedTitik) return ipPrivat(mappedTitik[1]);
  const mappedHeks = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHeks) {
    const tinggi = parseInt(mappedHeks[1], 16);
    const rendah = parseInt(mappedHeks[2], 16);
    return ipPrivat(`${tinggi >> 8}.${tinggi & 255}.${rendah >> 8}.${rendah & 255}`);
  }

  if (ip.includes(":")) {
    if (ip === "::" || ip === "::1") return true;
    if (/^f[cd]/.test(ip)) return true; // fc00::/7 unique local
    if (/^fe[89ab]/.test(ip)) return true; // fe80::/10 link local
    if (/^ff/.test(ip)) return true; // multicast
    if (ip.startsWith("2001:db8")) return true; // dokumentasi
    return false;
  }

  const bagian = ip.split(".").map(Number);
  if (bagian.length !== 4 || bagian.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true; // bentuk aneh diperlakukan sebagai terlarang
  }

  const [a, b, c] = bagian;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link local + metadata cloud
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 + 192.0.2.0/24
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmark
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  if (a >= 224) return true; // multicast + reserved
  return false;
}

/** Cek bentuk URL sebelum DNS: protokol, kredensial, port, hostname terlarang. */
export function urlAmanTanpaDns(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return "URL tidak valid.";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "Hanya alamat http/https yang bisa dibuka.";
  }
  if (url.username || url.password) {
    return "URL tidak boleh memuat username atau password.";
  }
  if (!PORT_DIIZINKAN.has(url.port)) {
    return "Port selain 80 dan 443 tidak diizinkan.";
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return "URL tidak memuat nama host.";
  if (host === "metadata.google.internal") return "Alamat metadata cloud tidak diizinkan.";
  if (host === "localhost" || host.endsWith(".localhost")) return "Alamat lokal tidak diizinkan.";
  if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".home.arpa")) {
    return "Alamat jaringan internal tidak diizinkan.";
  }

  // Host berupa IP literal langsung diperiksa; nama domain diperiksa setelah DNS.
  const ipLiteral = host.includes(":") || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  if (ipLiteral && ipPrivat(host)) return "Alamat IP privat tidak diizinkan.";

  return null;
}

/** Resolve hostname lalu pastikan seluruh alamatnya publik. */
async function hostPublik(host: string): Promise<boolean> {
  if (host.includes(":") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return !ipPrivat(host);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const batas = new Promise<never>((_, tolak) => {
    timer = setTimeout(() => tolak(new Error("dns-timeout")), 3000);
  });

  try {
    const hasil = await Promise.race([lookup(host, { all: true, verbatim: true }), batas]);
    if (hasil.length === 0) return false;
    return hasil.every((satu) => !ipPrivat(satu.address));
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type HasilAmbil = { ok: true; html: string; urlFinal: string } | { ok: false; alasan: string };

/** Fetch HTML dengan validasi URL, redirect manual, batas ukuran, dan timeout. */
export async function ambilHtmlAman(input: string): Promise<HasilAmbil> {
  const alasanAwal = urlAmanTanpaDns(input);
  if (alasanAwal) return { ok: false, alasan: alasanAwal };

  const kontrol = new AbortController();
  const jam = setTimeout(() => kontrol.abort(), BATAS_WAKTU_MS);

  try {
    let tujuan = new URL(input);

    for (let lompatan = 0; lompatan <= MAKS_REDIRECT; lompatan += 1) {
      if (!(await hostPublik(tujuan.hostname.replace(/^\[|\]$/g, "")))) {
        return { ok: false, alasan: "Alamat tujuan tidak dapat dijangkau karena mengarah ke jaringan privat." };
      }

      const res = await fetch(tujuan, {
        signal: kontrol.signal,
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const lokasi = res.headers.get("location");
        if (!lokasi) return { ok: false, alasan: "Halaman mengalihkan ke alamat kosong." };

        const berikut = new URL(lokasi, tujuan);
        const alasan = urlAmanTanpaDns(berikut.toString());
        if (alasan) return { ok: false, alasan };
        tujuan = berikut;
        continue;
      }

      if (!res.ok) {
        return {
          ok: false,
          alasan: `Halaman mengembalikan status HTTP ${res.status}. Silakan isi data penawaran secara manual.`,
        };
      }

      const tipe = res.headers.get("content-type");
      if (tipe && !tipe.toLowerCase().includes("text/html")) {
        return { ok: false, alasan: "Alamat ini bukan halaman HTML. Silakan isi data secara manual." };
      }

      const panjang = Number(res.headers.get("content-length") ?? "0");
      if (panjang > MAKS_BYTES) {
        return { ok: false, alasan: "Halaman terlalu besar untuk dibaca. Silakan isi data secara manual." };
      }

      const reader = res.body?.getReader();
      if (!reader) return { ok: false, alasan: "Halaman tidak mengirim isi yang bisa dibaca." };

      const decoder = new TextDecoder("utf-8");
      let html = "";
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAKS_BYTES) {
          await reader.cancel();
          return { ok: false, alasan: "Halaman terlalu besar untuk dibaca. Silakan isi data secara manual." };
        }
        html += decoder.decode(value, { stream: true });
      }
      html += decoder.decode();

      return { ok: true, html, urlFinal: tujuan.toString() };
    }

    return { ok: false, alasan: "Terlalu banyak pengalihan alamat." };
  } catch {
    return {
      ok: false,
      alasan: "Gagal menjangkau halaman (timeout atau proteksi akses). Silakan isi data secara manual.",
    };
  } finally {
    clearTimeout(jam);
  }
}
