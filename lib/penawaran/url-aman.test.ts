import { describe, expect, it } from "vitest";
import { ipPrivat, urlAmanTanpaDns } from "./url-aman";

describe("ipPrivat", () => {
  it.each([
    ["127.0.0.1", "loopback"],
    ["10.1.2.3", "kelas A privat"],
    ["172.16.0.1", "awal kelas B privat"],
    ["172.31.255.254", "akhir kelas B privat"],
    ["192.168.1.1", "kelas C privat"],
    ["169.254.169.254", "metadata cloud"],
    ["100.64.0.1", "CGNAT"],
    ["0.0.0.0", "alamat nol"],
    ["224.0.0.1", "multicast"],
    ["255.255.255.255", "broadcast"],
    ["::1", "loopback IPv6"],
    ["fe80::1", "link local IPv6"],
    ["fd00::1", "unique local IPv6"],
    ["::ffff:127.0.0.1", "IPv4 mapped"],
    ["::ffff:7f00:1", "IPv4 mapped heksadesimal"],
  ])("menolak %s (%s)", (alamat) => {
    expect(ipPrivat(alamat)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "172.32.0.1", "192.169.0.1", "2001:4860:4860::8888"])(
    "mengizinkan %s",
    (alamat) => {
      expect(ipPrivat(alamat)).toBe(false);
    },
  );
});

describe("urlAmanTanpaDns", () => {
  it("menolak protokol selain http/https", () => {
    expect(urlAmanTanpaDns("ftp://example.com/file")).toContain("http/https");
    expect(urlAmanTanpaDns("file:///etc/passwd")).toContain("http/https");
  });

  it("menolak kredensial di dalam URL", () => {
    expect(urlAmanTanpaDns("https://user:pass@example.com/")).toContain("username");
  });

  it("menolak port selain 80 dan 443", () => {
    expect(urlAmanTanpaDns("http://example.com:8080/")).toContain("Port");
    expect(urlAmanTanpaDns("https://example.com:22/")).toContain("Port");
  });

  it("menolak host lokal dan internal", () => {
    expect(urlAmanTanpaDns("http://localhost/")).toContain("lokal");
    expect(urlAmanTanpaDns("http://server.internal/")).toContain("internal");
    expect(urlAmanTanpaDns("http://metadata.google.internal/")).toContain("metadata");
  });

  it("menolak IP privat yang ditulis langsung", () => {
    expect(urlAmanTanpaDns("http://169.254.169.254/latest/meta-data")).toContain("privat");
    expect(urlAmanTanpaDns("http://[::1]/")).toContain("privat");
  });

  it("mengizinkan halaman publik biasa", () => {
    expect(urlAmanTanpaDns("https://shopee.co.id/product/1/2")).toBeNull();
    expect(urlAmanTanpaDns("http://example.com:80/")).toBeNull();
    expect(urlAmanTanpaDns("https://example.com:443/")).toBeNull();
  });
});
