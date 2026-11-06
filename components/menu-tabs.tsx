"use client";

/**
 * Tabs shared by the sections that UI-Spec 2.1 merged into one menu item:
 * Analitik (Ringkasan + Impor performa) and Aset (Link affiliate + Template
 * deskripsi). Same shape as ReviewTabs, driven by `TabMenu` in nav-config.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TabMenu } from "./nav-config";

export function MenuTabs({ tabs }: { tabs: readonly TabMenu[] }) {
  const pathname = usePathname();

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
