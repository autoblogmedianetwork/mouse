"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GROUP_LABELS, MENU_ITEMS, type MenuItem } from "./nav-config";

function NavItem({ item, onNavigate }: { item: MenuItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const base =
    "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors";
  const activeClass = active
    ? "bg-muted font-medium text-foreground"
    : "text-muted-foreground hover:bg-muted hover:text-foreground";

  if (!item.available) {
    return (
      <span
        aria-disabled="true"
        className={cn(base, "cursor-not-allowed text-muted-foreground/60")}
        title="Segera"
      >
        {item.label}
        <span className="rounded-full border border-surface-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
          Segera
        </span>
      </span>
    );
  }

  return (
    <Link href={item.href} className={cn(base, activeClass)} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const groups: Array<MenuItem["group"]> = ["workspace", "tools"];

  return (
    <div className="flex h-full flex-col">
      {/* Logo and workspace (UI-Spec section 2) */}
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          A
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">AutoThreads</p>
          <p className="text-xs text-muted-foreground">Ruang kerja pribadi</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {groups.map((group) => (
          <div key={group}>
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {GROUP_LABELS[group]}
            </p>
            <div className="space-y-1">
              {MENU_ITEMS.filter((item) => item.group === group).map((item) => (
                <NavItem key={item.href} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar desktop (240px per UI-Spec section 2) */}
      <aside className="hidden w-60 shrink-0 border-r border-surface-border bg-surface md:block">
        <SidebarContent />
      </aside>

      {/* Sidebar drawer mobile */}
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-60 border-r border-surface-border bg-surface">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 items-center gap-3 border-b border-surface-border bg-surface px-4">
          <button
            aria-label="Buka menu"
            className="rounded-lg border border-surface-border px-2 py-1 text-sm md:hidden"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
          <p className="text-sm text-muted-foreground">Workspace › AutoThreads</p>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
