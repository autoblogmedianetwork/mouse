"use client";

/**
 * Tab strip otomatis dari nav-config (Opsi B).
 *
 * Halaman yang digabung ke satu menu cukup menaruh <TabMenuOtomatis /> di atas
 * kontennya; daftar tab diambil dari `tabs` milik menu yang memiliki route ini.
 * Dengan begitu tab hanya didefinisikan sekali (nav-config), tidak tersebar di
 * banyak file dan tidak mungkin berbeda antar halaman.
 *
 * Bila route tidak punya tab, komponen tidak menampilkan apa pun.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MENU_ITEMS } from "./nav-config";

export function TabMenuOtomatis() {
  const pathname = usePathname();
  const menu = MENU_ITEMS.find((i) => (i.hrefs ?? [i.href]).includes(pathname));
  const tabs = menu?.tabs;
  if (!tabs || tabs.length < 2) return null;

  return (
    <nav aria-label="Bagian" className="flex gap-1 overflow-x-auto border-b-2 border-foreground">
      {tabs.map((tab) => {
        const aktif = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={aktif ? "page" : undefined}
            className={cn(
              "-mb-0.5 shrink-0 border-b-2 px-3 py-2 text-badan transition-colors",
              aktif
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:border-surface-border hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
