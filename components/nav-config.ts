/**
 * Menu structure per docs/UI-Spec-Heaviliate.md section 2.1 (ADR 0013).
 *
 * Three groups keep the growing route list readable: Produksi (make content),
 * Konten (review/publish/measure), and Alat (utilities). Every item carries its
 * phase instead of a permanent `available: true`, so the "Segera" label only
 * appears for routes that really do not exist yet. Items with more than one
 * page expose tabs through `tabs`, and the sidebar links to the first tab.
 */

export type GrupMenu = "produksi" | "konten" | "tools";

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
}

export const MENU_ITEMS: MenuItem[] = [
  // Workspace
  { label: "Dashboard", href: "/", group: "produksi", fase: "MVP" },
  // Mode fokus harian (Level 3): satu layar "hari ini posting apa" + streak.
  { label: "Fokus harian", href: "/fokus", group: "produksi", fase: "MVP" },
  // Rencana Perdana (Gelombang 4): 21 hari menuju komisi pertama, streak
  // menyatu dengan Fokus harian.
  { label: "Rencana Perdana", href: "/rencana", group: "produksi", fase: "MVP" },
  // Siap Copas: konten hari ini siap salin-tempel (publikasi tetap manual).
  { label: "Siap Copas", href: "/siap-copas", group: "konten", fase: "MVP" },
  // Hulu content machine: riset audiens lalu peluang produk (tahap 1-2).
  { label: "Riset audiens", href: "/riset", group: "produksi", fase: "MVP" },
  { label: "Buat posting", href: "/posting/baru", group: "produksi", fase: "MVP" },
  // Jalur video prompt manual: storyboard ChatGPT, video Google Flow.
  { label: "Buat video", href: "/video", group: "produksi", fase: "MVP" },
  // Lab konten (Gelombang 3): lab uji, ide dari masalah, serial 7 hari.
  { label: "Lab konten", href: "/lab", group: "produksi", fase: "MVP" },
  // Antrian dan riwayat digabung jadi satu item "Konten" dengan tab
  // (Fase 2-A, pola sama dengan Analitik/Aset).
  {
    label: "Konten",
    href: "/antrian",
    hrefs: ["/antrian", "/batch", "/riwayat"],
    group: "konten",
    fase: "MVP",
    tabs: [
      { label: "Antrian", href: "/antrian" },
      { label: "Batch", href: "/batch" },
      { label: "Riwayat", href: "/riwayat" },
    ],
  },
  // Tools
  { label: "Pencarian", href: "/cari", group: "tools", fase: "MVP" },
  // Rincian biaya AI per provider/fungsi (Fase 5); widget header tetap ringkas.
  { label: "Biaya AI", href: "/biaya", group: "tools", fase: "MVP" },
  { label: "Kalender", href: "/kalender", group: "konten", fase: "Level 2" },
  {
    // Impor laporan affiliate adalah masukan analisis, bukan halaman sendiri.
    label: "Analitik",
    href: "/analitik",
    hrefs: ["/impor"],
    group: "konten",
    fase: "Setelah M5",
    tabs: [
      { label: "Ringkasan", href: "/analitik" },
      { label: "Impor performa", href: "/impor" },
    ],
  },
  {
    label: "Aset",
    href: "/link",
    hrefs: ["/template"],
    group: "tools",
    fase: "MVP",
    tabs: [
      { label: "Link affiliate", href: "/link" },
      { label: "Template deskripsi", href: "/template" },
    ],
  },
  { label: "Pengaturan", href: "/pengaturan", group: "tools", fase: "MVP" },
];

export const GROUP_LABELS: Record<MenuItem["group"], string> = {
  produksi: "Produksi",
  konten: "Konten",
  tools: "Alat",
};

/**
 * Page no longer in the sidebar but still live. `/akun` is linked from
 * Pengaturan, section "Profil dan akun" (docs/UI-Spec-Heaviliate.md 2.1).
 */
export const MENU_TANPA_SIDEBAR: Record<string, string> = {
  "/akun": "Akun sosial",
};

/** Menu item owning a pathname, falling back to the raw path for breadcrumbs. */
export function labelHalaman(pathname: string, items: readonly MenuItem[] = MENU_ITEMS): string {
  const item = items.find(
    (i) => i.href === pathname || (i.hrefs ?? []).some((h) => h === pathname),
  );
  return item?.label ?? MENU_TANPA_SIDEBAR[pathname] ?? pathname;
}
