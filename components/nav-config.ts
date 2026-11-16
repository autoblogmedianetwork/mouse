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
  // --------------------------------------------------------------- mulai --
  // Dua hal yang dikerjakan SEKALI di awal, sebelum masuk alur harian.
  {
    label: "Hari Ini",
    href: "/",
    hrefs: ["/", "/fokus", "/rencana"],
    group: "mulai",
    fase: "MVP",
    kapan: "Mulai di sini setiap hari: apa yang harus dikerjakan sekarang.",
    tabs: [
      { label: "Ringkasan", href: "/" },
      { label: "Fokus hari ini", href: "/fokus" },
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

  // ---------------------------------------------------------------- alur --
  // Empat langkah utama. Nomor hanya dipakai di grup ini.
  {
    label: "Riset",
    href: "/riset",
    group: "alur",
    fase: "MVP",
    langkah: 1,
    kapan: "Cari produk yang layak dipromosikan. Sekali saja per produk.",
  },
  {
    label: "Katalog",
    href: "/katalog",
    group: "alur",
    fase: "MVP",
    kapan: "Daftar produk tersimpan: cari, duplikat, sembunyikan, atau buat konten.",
  },
  {
    label: "Buat Konten",
    href: "/posting/baru",
    hrefs: ["/posting/baru", "/video"],
    group: "alur",
    fase: "MVP",
    langkah: 2,
    kapan: "Ubah produk jadi konten siap tempel.",
    tabs: [
      { label: "Buat posting", href: "/posting/baru" },
      { label: "Buat video", href: "/video" },
    ],
  },
  {
    label: "Terbit",
    href: "/siap-copas",
    hrefs: ["/siap-copas", "/antrian", "/batch", "/riwayat"],
    group: "alur",
    fase: "MVP",
    langkah: 3,
    kapan: "Salin teks dan link hari ini, lalu tandai sudah ditempel.",
    tabs: [
      { label: "Siap Salin", href: "/siap-copas" },
      { label: "Antrian Posting", href: "/antrian" },
      { label: "Produksi Konten", href: "/batch" },
      { label: "Arsip Terbit", href: "/riwayat" },
    ],
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
    kapan: "Cek klik dan komisi, impor laporan Shopee.",
    tabs: [
      { label: "Ringkasan", href: "/analitik" },
      { label: "Impor performa", href: "/impor" },
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
    hrefs: ["/pengaturan", "/cari", "/biaya", "/link", "/template", "/akun"],
    group: "sistem",
    fase: "MVP",
    kapan: "Profil, persona, link affiliate, template, biaya AI, dan akun.",
    tabs: [
      { label: "Pengaturan", href: "/pengaturan" },
      { label: "Pencarian", href: "/cari" },
      { label: "Biaya AI", href: "/biaya" },
      { label: "Link dan Template", href: "/link" },
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

/** Langkah alur utama (1-4) sebagai data, dipakai bilah langkah di Hari Ini. */
export interface LangkahAlur {
  nomor: number;
  label: string;
  href: string;
  kapan: string;
}

export const LANGKAH_ALUR: LangkahAlur[] = MENU_ITEMS.filter(
  (i) => i.langkah !== undefined && i.aktif !== false,
)
  .sort((a, b) => (a.langkah ?? 0) - (b.langkah ?? 0))
  .map((i) => ({
    nomor: i.langkah as number,
    label: i.label,
    href: i.href,
    kapan: i.kapan ?? "",
  }));
