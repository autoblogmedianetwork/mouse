/**
 * Menu structure — Opsi B (Gelombang 5): tujuh menu, satu alur lurus.
 *
 * Alur kerja dibuat mengikuti urutan nyata pemakaian, dari belajar sampai
 * komisi pertama:
 *
 *   Hari Ini → Riset → Bikin Konten → Terbit → (Kalender, Analitik, Alat)
 *
 * Tiga menu pertama adalah jalur utama; tiga terakhir pendukung. Grup lama
 * (Produksi/Konten/Alat) dihapus karena membuat user harus memilih grup dulu
 * sebelum menemukan halaman. Semua route lama tetap hidup: yang digabung
 * tampil sebagai tab, jadi tautan/bookmark lama tidak mati.
 */

export type GrupMenu = "mulai" | "alur" | "pantau" | "sistem";

export type FaseMenu = "MVP" | "M6" | "Level 2" | "Setelah M5";

export interface TabMenu {
  label: string;
  href: string;
}

export interface MenuItem {
  label: string;
  /** Where the sidebar points; the first tab for multi-page sections. */
  href: string;
  group: GrupMenu;
  fase: FaseMenu;
  /**
   * Routes this item owns. The active-route match and the breadcrumb use this
   * list, so `/template` still highlights "Aset".
   */
  hrefs?: readonly string[];
  /** Sub-pages inside one section, rendered as a tab strip on those pages. */
  tabs?: readonly TabMenu[];
  /** False for phases that have not shipped; the item renders disabled. */
  aktif?: boolean;
  /** Satu kalimat: kapan menu ini dipakai. Tampil sebagai tooltip di sidebar. */
  kapan?: string;
  /** Nomor langkah alur utama (1-4); kosong untuk menu pendukung. */
  langkah?: number;
}

export const MENU_ITEMS: MenuItem[] = [
  // Semua menu berada di satu tingkat. Tidak ada menu yang menyembunyikan
  // menu lain di dalam tab; tab hanya dipakai untuk bagian dari SATU halaman
  // kerja (mis. Pengaturan), supaya tidak ada rute yang tidak bisa kembali.

  // -------------------------------------------------------------- mulai --
  {
    label: "Dashboard",
    href: "/",
    hrefs: ["/"],
    group: "mulai",
    fase: "MVP",
    kapan: "Ringkasan: sudah sampai mana, apa yang menunggu, berapa komisi.",
  },
  {
    label: "Fokus Hari Ini",
    href: "/fokus",
    hrefs: ["/fokus", "/rencana"],
    group: "mulai",
    fase: "MVP",
    kapan: "Satu langkah yang harus dikerjakan hari ini.",
    tabs: [
      { label: "Fokus", href: "/fokus" },
      { label: "Rencana Perdana", href: "/rencana" },
    ],
  },
  {
    label: "Branding Akun",
    href: "/branding",
    group: "mulai",
    fase: "MVP",
    kapan:
      "Tujuh postingan pembuka untuk akun baru: isi sekali, salin satu per hari, tanpa jualan.",
  },

  // --------------------------------------------------------------- alur --
  {
    label: "Riset",
    href: "/riset",
    group: "alur",
    fase: "MVP",
    kapan: "Cari masalah audiens dan produk yang layak dipromosikan.",
  },
  {
    label: "Katalog",
    href: "/katalog",
    group: "alur",
    fase: "MVP",
    kapan: "Daftar produk tersimpan: cari, duplikat, sembunyikan, atau buat konten.",
  },
  {
    label: "Buat Posting",
    href: "/posting/baru",
    group: "alur",
    fase: "MVP",
    kapan: "Ubah satu produk jadi utas Threads siap tempel.",
  },
  {
    label: "Buat Video",
    href: "/video",
    group: "alur",
    fase: "M6",
    kapan: "Susun naskah dan storyboard video pendek dari produk yang sama.",
  },
  {
    label: "Siap Salin",
    href: "/siap-copas",
    group: "alur",
    fase: "MVP",
    kapan: "Konten hari ini yang tinggal disalin ke platform.",
  },
  {
    label: "Antrian Posting",
    href: "/antrian",
    group: "alur",
    fase: "MVP",
    kapan: "Konten menunggu tinjauan sebelum ditandai siap posting.",
  },
  {
    label: "Produksi Konten",
    href: "/batch",
    group: "alur",
    fase: "MVP",
    kapan: "Buat banyak draft sekaligus dari beberapa produk.",
  },
  {
    label: "Arsip Terbit",
    href: "/riwayat",
    group: "pantau",
    fase: "MVP",
    kapan: "Catatan waktu, mode, dan status akhir setiap posting.",
  },

  // -------------------------------------------------------------- pantau --
  {
    label: "Kalender",
    href: "/kalender",
    group: "pantau",
    fase: "Level 2",
    kapan: "Lihat jadwal posting sebulan sekaligus.",
  },
  {
    label: "Analitik",
    href: "/analitik",
    hrefs: ["/analitik", "/impor"],
    group: "pantau",
    fase: "Setelah M5",
    kapan: "Cek klik dan komisi dari konten yang sudah terbit.",
    tabs: [
      { label: "Ringkasan", href: "/analitik" },
      { label: "Impor Performa", href: "/impor" },
    ],
  },

  // -------------------------------------------------------------- sistem --
  {
    label: "Eksperimen",
    href: "/lab",
    group: "sistem",
    fase: "MVP",
    kapan: "Sepuluh alat uji coba untuk menulis dan menguji ide konten.",
  },
  {
    label: "Pengaturan",
    href: "/pengaturan",
    hrefs: ["/pengaturan", "/link", "/template", "/biaya", "/akun", "/cari"],
    group: "sistem",
    fase: "MVP",
    kapan: "Profil, persona, link affiliate, template, biaya AI, dan akun.",
    tabs: [
      { label: "Umum", href: "/pengaturan" },
      { label: "Link dan Template", href: "/link" },
      { label: "Biaya AI", href: "/biaya" },
      { label: "Akun", href: "/akun" },
    ],
  },
];

export const GROUP_LABELS: Record<MenuItem["group"], string> = {
  mulai: "Mulai di sini",
  alur: "Alur kerja",
  pantau: "Pantau",
  sistem: "Sistem",
};

/** Urutan grup di sidebar. Disimpan terpisah agar tampilan tidak ikut data. */
export const GROUP_ORDER: GrupMenu[] = ["mulai", "alur", "pantau", "sistem"];

/**
 * Page no longer in the sidebar but still live. Sub-pages such as
 * `/template` and `/akun` are reachable from the pages that own them.
 */
export const MENU_TANPA_SIDEBAR: Record<string, string> = {
  "/akun": "Akun sosial",
  "/template": "Template deskripsi",
};

/** Menu item owning a pathname, falling back to the raw path for breadcrumbs. */
export function labelHalaman(pathname: string, items: readonly MenuItem[] = MENU_ITEMS): string {
  const item = items.find(
    (i) => i.href === pathname || (i.hrefs ?? []).some((h) => h === pathname),
  );
  return item?.label ?? MENU_TANPA_SIDEBAR[pathname] ?? pathname;
}

/** Menu item + tab owning a pathname (for breadcrumbs "Terbit · Siap copas"). */
export function menuUntuk(
  pathname: string,
  items: readonly MenuItem[] = MENU_ITEMS,
): { item: MenuItem; tab: TabMenu | null } | null {
  for (const item of items) {
    const cocok = item.href === pathname || (item.hrefs ?? []).some((h) => h === pathname);
    if (!cocok) continue;
    const tab = item.tabs?.find((t) => t.href === pathname) ?? null;
    return { item, tab };
  }
  return null;
}

/**
 * Langkah alur utama sebagai data, dipakai bilah langkah di Dashboard.
 *
 * Menu di sidebar sengaja DATAR (tanpa nomor), tetapi bilah alur tetap perlu
 * urutan karena tugasnya menunjukkan "saya di tahap mana, berikutnya apa".
 * Karena itu urutannya ditulis di sini, bukan diambil dari nomor menu.
 */
export interface LangkahAlur {
  nomor: number;
  label: string;
  href: string;
  kapan: string;
}

/** Empat tahap perjalanan affiliate, urut dari nol sampai komisi pertama. */
const URUTAN_LANGKAH: ReadonlyArray<{ nomor: number; label: string; href: string; kapan: string }> = [
  {
    nomor: 1,
    label: "Riset",
    href: "/riset",
    kapan: "Cari masalah audiens dan produk yang layak.",
  },
  {
    nomor: 2,
    label: "Buat Posting",
    href: "/posting/baru",
    kapan: "Ubah produk jadi utas siap tempel.",
  },
  {
    nomor: 3,
    label: "Siap Salin",
    href: "/siap-copas",
    kapan: "Salin teks dan link, tempel di Threads.",
  },
  {
    nomor: 4,
    label: "Arsip Terbit",
    href: "/riwayat",
    kapan: "Tandai sudah terbit, catat hasilnya.",
  },
];

export const LANGKAH_ALUR: LangkahAlur[] = URUTAN_LANGKAH.filter((l) =>
  MENU_ITEMS.some((m) => m.href === l.href || (m.hrefs ?? []).includes(l.href)),
).map((l) => ({ ...l }));
