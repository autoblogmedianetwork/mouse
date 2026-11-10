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
  const enc = enkripsiApiKey(input.apiKey);
  const { error } = await supabase.from("ai_provider").insert({
    user_id: user.id,
    nama: input.nama,
    base_url: input.baseUrl,
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
