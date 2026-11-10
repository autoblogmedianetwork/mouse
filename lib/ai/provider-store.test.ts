import { describe, expect, it } from "vitest";

process.env.AI_PROVIDER_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

import { dekripsiApiKey, enkripsiApiKey } from "./provider-store";

describe("enkripsi/dekripsi API key", () => {
  it("roundtrip", () => {
    const plain = "sk-test-123";
    const enc = enkripsiApiKey(plain);
    expect(enc).not.toBe(plain);
    expect(dekripsiApiKey(enc)).toBe(plain);
  });
});
