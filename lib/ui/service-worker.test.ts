import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guard service worker PWA: file ada, API tidak pernah di-cache, dan
 * offline fallback terpasang. Mencegah regresi "jawaban AI tersaji basi".
 */
const sw = readFileSync(join(process.cwd(), "public", "sw.js"), "utf-8");
const offline = readFileSync(join(process.cwd(), "public", "offline.html"), "utf-8");

describe("service worker PWA", () => {
  it("sw.js ada dan punya handler install/activate/fetch", () => {
    expect(sw).toContain('addEventListener("install"');
    expect(sw).toContain('addEventListener("activate"');
    expect(sw).toContain('addEventListener("fetch"');
  });

  it("API tidak pernah di-cache", () => {
    expect(sw).toContain('startsWith("/api/")');
  });

  it("navigasi memakai network-first dengan fallback offline.html", () => {
    expect(sw).toContain('"navigate"');
    expect(sw).toContain("OFFLINE_URL");
  });

  it("tidak menyimpan jawaban hasil redirect atau jawaban galat", () => {
    // Bug lama: rute yang di-redirect (mis. `/` → `/masuk`) ikut di-cache,
    // lalu browser menolak menyajikannya untuk navigasi sehingga fallback
    // offline tidak pernah muncul.
    expect(sw).toContain("function bolehDisimpan");
    expect(sw).toContain("res.redirected");
    expect(sw).toContain("res.status === 200");
    // Kedua tempat penyimpanan (aset & halaman) wajib memakai penjaga itu.
    const jumlahPenjaga = (sw.match(/bolehDisimpan\(res\)/g) ?? []).length;
    expect(jumlahPenjaga).toBeGreaterThanOrEqual(3); // definisi + 2 pemakaian
  });

  it("versi cache sudah dinaikkan supaya cache lama terbuang", () => {
    expect(sw).toContain('"heaviliate-v2"');
  });

  it("offline.html berisi pesan Indonesia dan tombol coba lagi", () => {
    expect(offline).toContain("Kamu sedang offline");
    expect(offline).toContain("Coba lagi");
  });
});
