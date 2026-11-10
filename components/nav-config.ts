/**
 * Menu structure per docs/UI-Spec-Heaviliate.md section 2.1 (ADR 0013).
 *
 * Eight items. Every item carries its phase instead of a permanent
 * `available: true`, so the "Segera" label only appears for routes that really
 * do not exist yet. Items with more than one page expose tabs through `tabs`,
 * and the sidebar links to the first tab so the section is always reachable.
 */

export type FaseMenu = "MVP" | "M6" | "Level 2" | "Setelah M5";

export interface TabMenu {
  label: string;
  href: string;
}

export interface MenuItem {
  label: string;
  /** Where the sidebar points; the first tab for multi-page sections. */
  href: string;
  group: "workspace" | "tools";
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
  { label: "Dashboard", href: "/", group: "workspace", fase: "MVP" },
  // Hulu content machine: riset audiens lalu peluang produk (tahap 1-2).
  { label: "Riset audiens", href: "/riset", group: "workspace", fase: "MVP" },
  { label: "Buat posting", href: "/posting/baru", group: "workspace", fase: "MVP" },
  // Jalur video prompt manual: storyboard ChatGPT, video Google Flow.
  { label: "Buat video", href: "/video", group: "workspace", fase: "MVP" },
  // Lab konten (Gelombang 3): lab uji, ide dari masalah, serial 7 hari.
  { label: "Lab konten", href: "/lab", group: "workspace", fase: "MVP" },
  // Antrian dan riwayat digabung jadi satu item "Konten" dengan tab
  // (Fase 2-A, pola sama dengan Analitik/Aset).
  {
    label: "Konten",
    href: "/antrian",
    hrefs: ["/antrian", "/riwayat"],
    group: "workspace",
    fase: "MVP",
    tabs: [
      { label: "Antrian", href: "/antrian" },
      { label: "Riwayat", href: "/riwayat" },
    ],
  },
  // Tools
  { label: "Kalender", href: "/kalender", group: "tools", fase: "Level 2" },
  {
    // Impor laporan affiliate adalah masukan analisis, bukan halaman sendiri.
    label: "Analitik",
    href: "/analitik",
    hrefs: ["/impor"],
    group: "tools",
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
  workspace: "Workspace",
  tools: "Tools",
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
