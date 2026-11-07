#!/usr/bin/env node
/**
 * `npm run akun:kata-sandi -- nama@email.com` — bootstrap a password login
 * without sending any email (ADR 0016).
 *
 * Supabase's built-in mailer only delivers to project team members and allows
 * two messages per hour, so a magic link is not always an option. This script
 * uses the service role key locally to create (or update) the account with a
 * confirmed email and a password the owner chooses. The password is read from
 * the terminal without echo and never printed, logged, or stored.
 *
 * Run it on your own machine only: SUPABASE_SERVICE_ROLE_KEY must never reach
 * a browser or a deployed route (AGENTS rule 11).
 */
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const berkas of [".env.local", ".env"]) {
  if (!existsSync(berkas)) continue;
  try {
    process.loadEnvFile(berkas);
  } catch {
    console.warn(`[akun] ${berkas} tidak bisa dibaca, dilewati.`);
  }
}

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const email = (process.argv[2] ?? "").trim().toLowerCase();

if (!url || !kunci) {
  console.error(
    "[akun] NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus ada di .env.local.",
  );
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  console.error("Pemakaian: npm run akun:kata-sandi -- nama@email.com");
  process.exit(1);
}

/** Same rules as lib/auth/kata-sandi.ts; kept inline so a plain node run has no build step. */
function validasi(nilai) {
  if (nilai.length < 8) return "Kata sandi minimal 8 karakter.";
  if (nilai.length > 72) return "Kata sandi maksimal 72 karakter.";
  if (!/\p{L}/u.test(nilai)) return "Kata sandi harus memuat huruf.";
  if (!/\d/.test(nilai)) return "Kata sandi harus memuat angka.";
  return null;
}

/** Prompt without echo when the terminal supports raw mode; fall back to stdin. */
function tanyaRahasia(teks) {
  const { stdin, stdout } = process;
  if (!stdin.isTTY) {
    return new Promise((resolve) => {
      let data = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (c) => {
        data += c;
      });
      stdin.on("end", () => resolve((data.split(/\r?\n/)[0] ?? "").trim()));
    });
  }
  return new Promise((resolve, reject) => {
    stdout.write(teks);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let nilai = "";
    const bersihkan = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
    };
    const onData = (potongan) => {
      for (const ch of potongan) {
        if (ch === "\r" || ch === "\n") {
          bersihkan();
          resolve(nilai.trim());
          return;
        }
        if (ch === "\u0003") {
          bersihkan();
          reject(new Error("Dibatalkan."));
          return;
        }
        if (ch === "\u007f" || ch === "\b") {
          nilai = nilai.slice(0, -1);
          continue;
        }
        if (ch >= " ") nilai += ch;
      }
    };
    stdin.on("data", onData);
  });
}

const sandi = await tanyaRahasia(`Kata sandi untuk ${email}: `);
const masalah = validasi(sandi);
if (masalah) {
  console.error(`[akun] ${masalah}`);
  process.exit(1);
}
const ulangi = await tanyaRahasia("Ulangi kata sandi: ");
if (sandi !== ulangi) {
  console.error("[akun] Ulangi kata sandi belum sama.");
  process.exit(1);
}

const supabase = createClient(url, kunci, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Find an existing account by email without assuming the id. */
async function cariId(nilaiEmail) {
  for (let halaman = 1; halaman <= 20; halaman += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page: halaman, perPage: 200 });
    if (error) throw error;
    const ketemu = data.users.find((u) => (u.email ?? "").toLowerCase() === nilaiEmail);
    if (ketemu) return ketemu.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

try {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: sandi,
    email_confirm: true,
  });

  if (!error) {
    console.log(
      `[akun] Akun baru dibuat: ${email} (id ${data.user.id}). Masuk di /masuk → "Masuk dengan kata sandi".`,
    );
    process.exit(0);
  }

  if (!/already|registered|exists/i.test(error.message)) throw error;

  const id = await cariId(email);
  if (!id) throw new Error(`Akun ${email} dilaporkan ada, tetapi tidak ditemukan di daftar user.`);

  const { error: galatUbah } = await supabase.auth.admin.updateUserById(id, {
    password: sandi,
    email_confirm: true,
  });
  if (galatUbah) throw galatUbah;

  console.log(
    `[akun] Kata sandi diperbarui untuk ${email} (id ${id}). Masuk di /masuk → "Masuk dengan kata sandi".`,
  );
} catch (e) {
  console.error(`[akun] Gagal: ${e?.message ?? e}`);
  process.exit(1);
}
