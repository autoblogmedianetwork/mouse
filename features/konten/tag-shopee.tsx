"use client";

/**
 * Tag Pelacak Shopee (khusus Shopee Affiliate).
 *
 * Shopee menerima parameter `tag` berupa alfanumerik untuk memantau klik per
 * sumber. Komponen ini menyusun tag [Platform][Jenis][Produk], menempelkannya
 * ke link affiliate, lalu menyediakan tombol salin. Tag terakhir disimpan
 * per konten supaya laporan bulanan tetap konsisten.
 */
import { useState, useSyncExternalStore } from "react";
import {
  JENIS_TAG,
  KODE_JENIS,
  LABEL_PLATFORM,
  MAKS_TAG,
  PLATFORM_TAG,
  pasangTag,
  susunTag,
  tagDariLink,
  tagValid,
  type JenisTag,
  type PlatformTag,
} from "@/lib/affiliate/tag-shopee";

const inputClass =
  "w-full border border-surface-border bg-surface px-3 py-2 text-badan outline-none focus:border-primary";

/** Kunci localStorage per konten. */
function kunciSimpan(kontenId: string) {
  return `autothreads-tag-shopee-${kontenId}`;
}

interface Tersimpan {
  platform: PlatformTag;
  jenis: JenisTag;
  tag: string;
}

function subscribeTanpaPerubahan() {
  return () => {};
}

/**
 * Ubah nilai localStorage menjadi pilihan awal. Bila belum ada tag tersimpan,
 * susun tag default dari nama produk supaya user tidak mengetik dari nol.
 */
function bacaTersimpan(mentah: string, namaProduk: string): Tersimpan {
  if (mentah === "") {
    return { platform: "threads", jenis: "status", tag: susunTag("threads", "status", namaProduk) };
  }
  try {
    const data = JSON.parse(mentah) as Partial<Tersimpan>;
    const platform = (PLATFORM_TAG as readonly string[]).includes(data.platform ?? "")
      ? (data.platform as PlatformTag)
      : "threads";
    const jenis = (JENIS_TAG as readonly string[]).includes(data.jenis ?? "")
      ? (data.jenis as JenisTag)
      : "status";
    return {
      platform,
      jenis,
      tag: typeof data.tag === "string" && data.tag !== "" ? data.tag : susunTag(platform, jenis, namaProduk),
    };
  } catch {
    return { platform: "threads", jenis: "status", tag: susunTag("threads", "status", namaProduk) };
  }
}

export function TagShopee({
  kontenId,
  namaProduk,
  link,
}: {
  kontenId: string;
  namaProduk: string;
  link: string;
}) {
  // Tag tersimpan dibaca lewat useSyncExternalStore supaya tidak ada setState
  // di dalam effect (markup server = klien, tanpa cascading render).
  const tersimpan = useSyncExternalStore(
    subscribeTanpaPerubahan,
    () => (typeof window === "undefined" ? "" : (window.localStorage.getItem(kunciSimpan(kontenId)) ?? "")),
    () => "",
  );
  const awal = bacaTersimpan(tersimpan, namaProduk);

  const [pilihan, setPilihan] = useState<{ platform: PlatformTag; jenis: JenisTag; tag: string } | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  const platform = pilihan?.platform ?? awal.platform;
  const jenis = pilihan?.jenis ?? awal.jenis;
  const tag = pilihan?.tag ?? awal.tag;

  const setPlatform = (p: PlatformTag) => setPilihan({ ...{ platform, jenis, tag }, platform: p });
  const setJenis = (j: JenisTag) => setPilihan({ ...{ platform, jenis, tag }, jenis: j });
  const setTag = (t: string) => setPilihan({ ...{ platform, jenis, tag }, tag: t });

  const simpan = (p: PlatformTag, j: JenisTag, t: string) => {
    try {
      window.localStorage.setItem(kunciSimpan(kontenId), JSON.stringify({ platform: p, jenis: j, tag: t }));
    } catch {
      // penyimpanan penuh/diblokir: tag tetap dipakai di sesi ini
    }
  };

  const pilihPlatform = (p: PlatformTag) => {
    setPlatform(p);
    const t = susunTag(p, jenis, namaProduk);
    setTag(t);
    simpan(p, jenis, t);
    setPesan(null);
  };

  const pilihJenis = (j: JenisTag) => {
    setJenis(j);
    const t = susunTag(platform, j, namaProduk);
    setTag(t);
    simpan(platform, j, t);
    setPesan(null);
  };

  const buatUlang = () => {
    const t = susunTag(platform, jenis, namaProduk);
    setTag(t);
    simpan(platform, jenis, t);
    setPesan(null);
  };

  const ubahTag = (nilai: string) => {
    setTag(nilai);
    simpan(platform, jenis, nilai);
    setPesan(null);
  };

  const salinLink = async () => {
    const bertag = pasangTag(link, tag);
    if (bertag === link && tagValid(tag)) {
      setPesan("Link tidak bisa dibaca sebagai URL. Tempel manual di browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(bertag);
      setPesan("Link bertag disalin. Tempel di platform, lalu klik produknya di Shopee.");
    } catch {
      setPesan("Browser menolak menyalin otomatis. Salin link di bawah secara manual.");
    }
  };

  const tagDiLink = tagDariLink(link);
  const linkBertag = tagValid(tag) ? pasangTag(link, tag) : link;

  return (
    <div className="space-y-2 border border-surface-border bg-muted/30 p-3">
      <p className="text-badan font-medium">Tag pelacak Shopee (opsional)</p>
      <p className="text-meta text-muted-foreground">
        Tag membuat laporan Shopee terpotong per platform &amp; jenis konten. Hanya huruf dan
        angka (maks {MAKS_TAG} karakter).
      </p>

      <div className="flex flex-wrap gap-1">
        {PLATFORM_TAG.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => pilihPlatform(p)}
            className={`h-8 border px-2 text-meta font-medium ${
              platform === p
                ? "border-primary bg-primary text-primary-foreground"
                : "border-surface-border hover:bg-muted"
            }`}
          >
            {LABEL_PLATFORM[p]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {JENIS_TAG.map((j) => (
          <button
            key={j}
            type="button"
            onClick={() => pilihJenis(j)}
            className={`h-8 border px-2 text-meta font-medium ${
              jenis === j
                ? "border-primary bg-primary text-primary-foreground"
                : "border-surface-border hover:bg-muted"
            }`}
          >
            {KODE_JENIS[j]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-meta flex-1">
          <span className="block text-muted-foreground">Tag ({tag.length}/{MAKS_TAG})</span>
          <input
            value={tag}
            onChange={(e) => ubahTag(e.target.value.slice(0, MAKS_TAG))}
            className={`${inputClass} font-mono`}
            placeholder="THStatusNamaProduk"
          />
        </label>
        <button
          type="button"
          onClick={buatUlang}
          className="inline-flex h-9 items-center border border-surface-border px-3 text-meta font-medium hover:bg-muted"
        >
          Susun ulang
        </button>
        <button
          type="button"
          onClick={salinLink}
          disabled={!tagValid(tag)}
          className="inline-flex h-9 items-center bg-primary px-3 text-meta font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Salin link bertag
        </button>
      </div>

      {!tagValid(tag) && tag !== "" ? (
        <p className="text-meta text-status-failed">
          Tag hanya boleh huruf dan angka (tanpa spasi/tanda baca).
        </p>
      ) : null}

      {tagDiLink && tagValid(tag) && tagDiLink !== tag ? (
        <p className="text-meta text-muted-foreground">
          Link aslinya sudah bertag <span className="font-mono">{tagDiLink}</span> — tag di atas
          akan menggantinya.
        </p>
      ) : null}

      {tagValid(tag) && link !== "" ? (
        <p className="break-all font-mono text-meta text-muted-foreground">{linkBertag}</p>
      ) : null}

      {pesan ? (
        <p className="text-meta text-status-ready" role="status">
          {pesan}
        </p>
      ) : null}
    </div>
  );
}
