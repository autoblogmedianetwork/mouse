import { describe, expect, it } from "vitest";
import { bangunIntentThreads } from "./intent-threads";

describe("bangunIntentThreads", () => {
  it("membangun URL intent dengan teks terenkode", () => {
    const hasil = bangunIntentThreads("Nasi hangat sepanjang hari! #dapur");
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.url.startsWith("https://www.threads.com/intent/post?text=")).toBe(true);
    expect(hasil.url).toContain("Nasi%20hangat");
    expect(hasil.url).toContain("%23dapur");
  });

  it("mengenkode baris baru dan karakter khusus dengan aman", () => {
    const hasil = bangunIntentThreads("baris satu\nbaris dua & siap");
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.url).toContain("%0A");
    expect(hasil.url).toContain("%26");
  });

  it("menolak teks kosong", () => {
    const hasil = bangunIntentThreads("   ");
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toContain("kosong");
  });

  it("menolak teks melebihi 500 karakter", () => {
    const hasil = bangunIntentThreads("a".repeat(501));
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.alasan).toContain("501");
    expect(hasil.alasan).toContain("500");
  });

  it("teks tepat 500 karakter diterima", () => {
    const hasil = bangunIntentThreads("a".repeat(500));
    expect(hasil.ok).toBe(true);
  });

  it("tidak memakai parameter url — link tetap di balasan sesuai strategi", () => {
    const hasil = bangunIntentThreads("Teks utama tanpa link.");
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.url).not.toContain("url=");
  });
});
