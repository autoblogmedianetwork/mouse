/**
 * Penyimpanan provider AI per user di Supabase, dengan API key terenkripsi
 * (AES-256-GCM). Kunci master (`AI_PROVIDER_SECRET`, 32 byte) hanya di server.
 * Kunci API tidak pernah dikembalikan ke klien dalam bentuk terang.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { klienServer, penggunaSaatIni } from "@/lib/supabase/server";

export interface ProviderAI {
  id: string;
  nama: string;
  baseUrl: string;
  model: string;
  isActive: boolean;
}

export interface ProviderAISecret extends ProviderAI {
  apiKey: string;
}

function masterKey(): Buffer {
  const raw = process.env.AI_PROVIDER_SECRET?.trim();
  if (!raw) throw new Error("AI_PROVIDER_SECRET belum diisi (32 byte, hex/base64).");
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  const b = Buffer.from(raw, "base64");
  if (b.length === 32) return b;
  throw new Error("AI_PROVIDER_SECRET harus 32 byte (hex 64 char atau base64 44 char).");
}

/**
 * Validasi baseUrl provider untuk mencegah SSRF: hanya http(s) ke host publik.
 * Loopback, private, link-local, dan metadata cloud ditolak.
 * Mengembalikan URL ternormalisasi (tanpa trailing slash) atau null.
 */
export function validasiBaseUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  // IP literal: tolak loopback/private/link-local (IPv4 + IPv6).
  if (/^[0-9.]+$/.test(host)) {
    const oktet = host.split(".").map(Number);
    if (oktet.length !== 4 || oktet.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
    const [a, b] = oktet;
    if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return null;
  }
  if (host.includes(":")) {
    // IPv6: loopback, link-local fe80::/10, unique local fc00::/7, unspecified.
    const h = host.replace(/\[|\]/g, "");
    if (h === "::1" || h === "::" || /^f[cd]/.test(h) || /^fe[89ab]/.test(h)) return null;
    // IPv4-mapped IPv6 (::ffff:..., termasuk bentuk hex seperti ::ffff:a00:1)
    // ditolak seluruhnya: provider publik tidak pernah butuh format ini.
    if (h.startsWith("::ffff:")) return null;
  }
  return parsed.origin + (parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, ""));
}

export function enkripsiApiKey(plain: string): string {
  const key = masterKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function dekripsiApiKey(enc: string): string {
  const key = masterKey();
  const [ivB, tagB, ctB] = enc.split(":");
  const iv = Buffer.from(ivB, "base64");
  const tag = Buffer.from(tagB, "base64");
  const ct = Buffer.from(ctB, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

export async function providerKandidat(): Promise<ProviderAISecret[]> {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) return [];
  const { data, error } = await supabase
    .from("ai_provider")
    .select("id,nama,base_url,model,api_key_enc,is_active,created_at")
    .eq("user_id", user.id)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  const out: ProviderAISecret[] = [];
  for (const row of data) {
    try {
      out.push({
        id: row.id,
        nama: row.nama,
        baseUrl: row.base_url,
        model: row.model,
        isActive: row.is_active,
        apiKey: dekripsiApiKey(row.api_key_enc),
      });
    } catch {
      // skip provider yang gagal didekripsi
    }
  }
  return out;
}

export async function daftarProvider(): Promise<ProviderAI[]> {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) return [];
  const { data, error } = await supabase
    .from("ai_provider")
    .select("id,nama,base_url,model,is_active")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((r: { id: string; nama: string; base_url: string; model: string; is_active: boolean }) => ({
    id: r.id,
    nama: r.nama,
    baseUrl: r.base_url,
    model: r.model,
    isActive: r.is_active,
  }));
}

// Cache in-memory (per instance) untuk mengurangi query DB per panggilan AI.
const CACHE_TTL_MS = 30_000;
const cacheAktif = new Map<string, { nilai: ProviderAISecret | null; kadaluarsa: number }>();

export function invalidateProviderCache(userId?: string): void {
  if (userId) cacheAktif.delete(userId);
  else cacheAktif.clear();
}

export async function providerAktif(): Promise<ProviderAISecret | null> {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) return null;

  const cached = cacheAktif.get(user.id);
  if (cached && cached.kadaluarsa > Date.now()) return cached.nilai;

  const { data, error } = await supabase
    .from("ai_provider")
    .select("id,nama,base_url,model,api_key_enc")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  let nilai: ProviderAISecret | null = null;
  if (!error && data) {
    try {
      nilai = {
        id: data.id,
        nama: data.nama,
        baseUrl: data.base_url,
        model: data.model,
        isActive: true,
        apiKey: dekripsiApiKey(data.api_key_enc),
      };
    } catch {
      nilai = null;
    }
  }
  cacheAktif.set(user.id, { nilai, kadaluarsa: Date.now() + CACHE_TTL_MS });
  return nilai;
}

export async function tambahProvider(input: {
  nama: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) return { ok: false, error: "Sesi tidak ditemukan." };
  const baseUrlBersih = validasiBaseUrl(input.baseUrl);
  if (!baseUrlBersih) {
    return { ok: false, error: "Base URL harus http(s) ke host publik (localhost & IP internal tidak boleh)." };
  }
  const enc = enkripsiApiKey(input.apiKey);
  const { error } = await supabase.from("ai_provider").insert({
    user_id: user.id,
    nama: input.nama,
    base_url: baseUrlBersih,
    model: input.model,
    api_key_enc: enc,
    is_active: false,
  });
  if (error) return { ok: false, error: error.message };
  invalidateProviderCache(user.id);
  return { ok: true };
}

export async function hapusProvider(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) return { ok: false, error: "Sesi tidak ditemukan." };
  const { error } = await supabase.from("ai_provider").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  invalidateProviderCache(user.id);
  return { ok: true };
}

export async function aktifkanProvider(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) return { ok: false, error: "Sesi tidak ditemukan." };
  // nonaktifkan semua dulu
  await supabase.from("ai_provider").update({ is_active: false }).eq("user_id", user.id);
  const { error } = await supabase
    .from("ai_provider")
    .update({ is_active: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  invalidateProviderCache(user.id);
  return { ok: true };
}

/**
 * Fungsi murni: rancang kolom pembaruan provider untuk PATCH.
 * API key kosong/tidak ada = kunci lama DIPERTAHANKAN (api_key_enc tidak
 * ikut di-update). Base URL divalidasi ulang (anti-SSRF tetap berlaku).
 */
export function rancangPembaruanProvider(input: {
  nama?: string;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  isActive?: boolean;
}): { kolom: Record<string, unknown> } | { error: string } {
  const kolom: Record<string, unknown> = {};
  if (input.nama !== undefined) {
    const nama = input.nama.trim();
    if (!nama || nama.length > 80) return { error: "Nama wajib 1-80 karakter." };
    kolom.nama = nama;
  }
  if (input.baseUrl !== undefined) {
    const baseUrlBersih = validasiBaseUrl(input.baseUrl);
    if (!baseUrlBersih) {
      return { error: "Base URL harus http(s) ke host publik (localhost & IP internal tidak boleh)." };
    }
    kolom.base_url = baseUrlBersih;
  }
  if (input.model !== undefined) {
    const model = input.model.trim();
    if (!model || model.length > 120) return { error: "Model wajib 1-120 karakter." };
    kolom.model = model;
  }
  // Kunci hanya diubah bila DIISI — kosong berarti pertahankan yang lama.
  if (input.apiKey !== undefined && input.apiKey.trim() !== "") {
    if (input.apiKey.length > 500) return { error: "API key maksimal 500 karakter." };
    kolom.api_key_enc = enkripsiApiKey(input.apiKey.trim());
  }
  if (input.isActive !== undefined) kolom.is_active = input.isActive;
  return { kolom };
}

/**
 * Edit provider milik user: nama/base URL/model, ganti kunci (opsional),
 * dan set aktif/nonaktif. isActive=true menonaktifkan provider lain
 * (satu utama, sisanya cadangan — semantik sama dengan aktifkanProvider).
 */
export async function ubahProvider(input: {
  id: string;
  nama?: string;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  isActive?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await klienServer();
  const user = supabase ? await penggunaSaatIni() : null;
  if (!supabase || !user) return { ok: false, error: "Sesi tidak ditemukan." };

  const rancangan = rancangPembaruanProvider(input);
  if ("error" in rancangan) return { ok: false, error: rancangan.error };
  if (Object.keys(rancangan.kolom).length === 0) {
    return { ok: false, error: "Tidak ada perubahan yang dikirim." };
  }

  // Pastikan provider itu milik user ini sebelum menyentuh apa pun.
  const ada = await supabase
    .from("ai_provider")
    .select("id")
    .eq("id", input.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (ada.error) return { ok: false, error: ada.error.message };
  if (!ada.data) return { ok: false, error: "Provider tidak ditemukan." };

  if (input.isActive === true) {
    // Satu utama: matikan yang lain dulu (semantik aktifkanProvider).
    await supabase.from("ai_provider").update({ is_active: false }).eq("user_id", user.id);
  }
  const { error } = await supabase
    .from("ai_provider")
    .update(rancangan.kolom)
    .eq("id", input.id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  invalidateProviderCache(user.id);
  return { ok: true };
}
