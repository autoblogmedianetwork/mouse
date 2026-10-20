/**
 * Adapter untuk Pollinations.ai (Generator gambar AI gratis tanpa API key).
 * Digunakan sebagai visual pendukung (latar belakang aesthetic / ilustrasi suasana)
 * pada slide Carousel (ADR 0003 & docs/fitur-carousel.md).
 *
 * Seluruh komputasi berjalan di cloud Pollinations, 0% membebani CPU/GPU laptop.
 */

export const POLLINATIONS_BASE_URL = "https://image.pollinations.ai/prompt";

export interface PollinationsOptions {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  nologo?: boolean;
  model?: string;
}

/**
 * Membuat URL gambar Pollinations dengan parameter yang aman dan ter-encode.
 */
export function buildPollinationsUrl(options: PollinationsOptions): string {
  const {
    prompt,
    width = 1080,
    height = 1350,
    seed,
    nologo = true,
    model = "flux",
  } = options;

  const cleanPrompt = prompt.trim() || "aesthetic minimalist background, soft lighting";
  const encodedPrompt = encodeURIComponent(cleanPrompt);

  const queryParams = new URLSearchParams();
  queryParams.set("width", String(width));
  queryParams.set("height", String(height));
  if (nologo) queryParams.set("nologo", "true");
  if (model) queryParams.set("model", model);
  if (typeof seed === "number") queryParams.set("seed", String(seed));

  return `${POLLINATIONS_BASE_URL}/${encodedPrompt}?${queryParams.toString()}`;
}

/**
 * Menghasilkan rekomendasi prompt visual bahasa Inggris (gaya lifestyle / suasana)
 * yang cocok untuk background slide tanpa memalsukan barang fisik.
 */
export function rekomendasiPromptVisual(
  peran: "cover" | "isi" | "cta",
  judulPoin: string,
  namaProduk?: string,
): string {
  const konteks = (judulPoin || namaProduk || "daily lifestyle").trim();

  if (peran === "cover") {
    return `relatable real life situation, problem or struggle scene related to ${konteks}, cinematic lighting, photorealistic, moody atmosphere, authentic emotion, high detail, no text, no watermark`;
  }

  if (peran === "cta") {
    return `minimalist aesthetic desk setup, warm cozy ambient light, clean workspace, soft shadows, peaceful mood, photorealistic, no text, no watermark`;
  }

  return `clean aesthetic background concept representing ${konteks}, soft natural daylight, shallow depth of field, modern minimalist interior, high quality, no text, no watermark`;
}

/**
 * Mengecek apakah layanan Pollinations.ai dapat diakses dari browser/koneksi saat ini.
 */
export async function isPollinationsAvailable(timeoutMs = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // Ping endpoint ringan untuk tes koneksi
    const testUrl = `${POLLINATIONS_BASE_URL}/minimalist?width=64&height=64&nologo=true`;
    const res = await fetch(testUrl, {
      method: "HEAD",
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeout);
    return Boolean(res && (res.ok || res.status < 500));
  } catch {
    return false;
  }
}
