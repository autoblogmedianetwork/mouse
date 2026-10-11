// Menu structure per UI-Spec-AutoThreads.md section 2.1.
// "Segera" menus are shown but not clickable until their phase ships.

export interface MenuItem {
  label: string;
  href: string;
  group: "workspace" | "tools";
  available: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
  // Workspace group
  { label: "Dashboard", href: "/", group: "workspace", available: true },
  { label: "Buat posting", href: "/posting/baru", group: "workspace", available: true },
  { label: "Antrian review", href: "/antrian", group: "workspace", available: true },
  { label: "Akun sosial", href: "/akun", group: "workspace", available: false },
  { label: "Kalender", href: "/kalender", group: "workspace", available: false },
  { label: "Riwayat posting", href: "/riwayat", group: "workspace", available: true },
  // Tools group
  { label: "Analitik", href: "/analitik", group: "tools", available: true },
  // Impor laporan affiliate (Shopee, TikTok Shop, Tokopedia).
  { label: "Impor performa", href: "/impor", group: "tools", available: true },
  { label: "Link affiliate", href: "/link", group: "tools", available: true },
  { label: "Template deskripsi", href: "/template", group: "tools", available: true },
  { label: "Pengaturan", href: "/pengaturan", group: "tools", available: true },
];

export const GROUP_LABELS: Record<MenuItem["group"], string> = {
  workspace: "Workspace",
  tools: "Tools",
};
