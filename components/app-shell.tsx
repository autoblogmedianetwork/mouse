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
    ? "bg-primary/8 text-primary-foreground font-medium"
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
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          A
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-foreground">Heaviliate</p>
          <p className="truncate text-xs text-muted-foreground">Ruang kerja pribadi</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 pb-4">
        {groups.map((group) => (
          <div key={group}>
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

      <div className="mt-auto rounded-lg border border-surface-border bg-surface p-4">
        <p className="text-xs font-semibold text-muted-foreground">Aktif hari ini</p>
        <p className="mt-1 text-sm text-muted-foreground">Sesi pribadi · login magic link</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 border-r border-surface-border bg-surface md:block">
        <SidebarContent />
      </aside>

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
        <header className="flex h-14 items-center gap-3 border-b border-surface-border bg-background px-4">
          <button
            aria-label="Buka menu"
            className="rounded-lg border border-surface-border px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted md:hidden"
            onClick={() => setOpen(true)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              A
            </span>
            <span className="hidden sm:inline">Heaviliate</span>
          </Link>
          <p className="text-xs text-muted-foreground">Workspace › {undefined}</p>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
