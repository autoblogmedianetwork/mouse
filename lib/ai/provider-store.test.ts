import { describe, expect, it } from "vitest";

process.env.AI_PROVIDER_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

import { dekripsiApiKey, enkripsiApiKey, validasiBaseUrl } from "./provider-store";


describe("enkripsi/dekripsi API key", () => {
  it("roundtrip", () => {
    const plain = "sk-test-123";
    const enc = enkripsiApiKey(plain);
    expect(enc).not.toBe(plain);
    expect(dekripsiApiKey(enc)).toBe(plain);
  });
});

describe("validasiBaseUrl anti-SSRF", () => {
  it("menerima https host publik dan menormalkan trailing slash", () => {
    expect(validasiBaseUrl("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1");
    expect(validasiBaseUrl("http://contoh-provider.com/v1")).toBe("http://contoh-provider.com/v1");
  });

  it("menolak skema selain http(s)", () => {
    expect(validasiBaseUrl("file:///etc/passwd")).toBeNull();
    expect(validasiBaseUrl("ftp://host/x")).toBeNull();
    expect(validasiBaseUrl("bukan url")).toBeNull();
  });

  it("menolak loopback, private, link-local, dan metadata cloud", () => {
    expect(validasiBaseUrl("http://localhost:3000/v1")).toBeNull();
    expect(validasiBaseUrl("http://127.0.0.1:8080/v1")).toBeNull();
    expect(validasiBaseUrl("http://10.0.0.5/v1")).toBeNull();
    expect(validasiBaseUrl("http://192.168.1.1/v1")).toBeNull();
    expect(validasiBaseUrl("http://172.16.0.9/v1")).toBeNull();
    expect(validasiBaseUrl("http://169.254.169.254/latest")).toBeNull();
    expect(validasiBaseUrl("http://[::1]:5000/v1")).toBeNull();
    expect(validasiBaseUrl("http://[::ffff:10.0.0.1]/v1")).toBeNull();
    expect(validasiBaseUrl("http://db.internal/v1")).toBeNull();
  });
});
