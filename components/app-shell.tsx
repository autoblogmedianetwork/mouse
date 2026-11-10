"use client";

/**
 * AppShell — Swiss Industrial Print frame (ADR 0009, structure in ADR 0013):
 * sidebar with hard 1px/2px rules, monospace uppercase group labels, no radius
 * (guaranteed by the global token), no soft shadow.
 *
 * Pass 3 changes: nine menu items driven by phase flags, active-route matching
 * through `lib/nav/aktif.ts` (segment boundary, so `/posting/baru/[id]` marks
 * "Buat posting"), and a breadcrumb in the topbar replacing the static
 * "WAJAH KERJA ///" meta.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { menuUntuk } from "@/lib/nav/aktif";
import { BudgetIndicator } from "./budget-indicator";
import { GROUP_LABELS, MENU_ITEMS, labelHalaman, type MenuItem } from "./nav-config";
import { ShellPengguna } from "./shell-pengguna";

/** Terminal meta style: small mono uppercase with wide tracking (ADR 0013). */
const mikro = "font-mono text-meta uppercase tracking-meta";

function NavItem({ item, onNavigate }: { item: MenuItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = menuUntuk(pathname, MENU_ITEMS)?.href === item.href;
  const base =
    "flex items-center justify-between border-l-2 px-3 py-2 text-badan transition-colors";
  const activeClass = active
    ? "border-primary bg-primary/10 font-medium text-foreground"
    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground";

  if (item.aktif === false) {
    return (
      <span
        aria-disabled="true"
        className={cn(base, "cursor-not-allowed border-transparent text-muted-foreground/60")}
        title={`Segera · ${item.fase}`}
      >
        {item.label}
        <span className={cn(mikro, "text-mikro")}>Segera</span>
      </span>
    );
  }

  return (
    <Link href={item.href} className={cn(base, activeClass)} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

function SidebarContent({
  email,
  onNavigate,
}: {
  email: string | null;
  onNavigate?: () => void;
}) {
  const groups: Array<MenuItem["group"]> = ["workspace", "tools"];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b-2 border-foreground px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary font-mono text-isi font-bold text-primary-foreground">
            H
          </span>
          <div className="min-w-0">
            <p className="truncate text-badan font-bold uppercase tracking-tight text-foreground">
              Heaviliate
            </p>
            <p className={cn(mikro, "truncate text-mikro text-muted-foreground")}>
              WORKSPACE / 01
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 pb-4">
        {groups.map((group) => (
          <div key={group}>
            <p className={cn(mikro, "border-b border-surface-border px-3 pb-1 text-muted-foreground")}>
              [ {GROUP_LABELS[group]} ]
            </p>
            <div className="mt-1 space-y-0.5">
              {MENU_ITEMS.filter((item) => item.group === group)
                .filter((item) => item.aktif !== false)
                .map((item) => (
                  <NavItem key={item.href} item={item} onNavigate={onNavigate} />
                ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t-2 border-foreground bg-surface p-4">
        <p className={cn(mikro, "text-muted-foreground")}>[ SESI ] AKTIF HARI INI</p>
        <ShellPengguna email={email} />
      </div>
    </div>
  );
}

/** Breadcrumb from the real menu structure: Workspace › Halaman. */
function Breadcrumb() {
  const pathname = usePathname();
  const halaman = labelHalaman(pathname);
  const grup = menuUntuk(pathname, MENU_ITEMS)?.group ?? "workspace";

  return (
    <nav aria-label="Breadcrumb" className={cn(mikro, "min-w-0 text-muted-foreground")}>
      <ol className="flex min-w-0 items-center gap-2">
        <li className="hidden sm:block">{GROUP_LABELS[grup]}</li>
        <li aria-hidden="true" className="hidden sm:block">
          /
        </li>
        <li className="truncate text-foreground" aria-current="page">
          {halaman}
        </li>
      </ol>
    </nav>
  );
}

export function AppShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 border-r-2 border-foreground bg-surface md:block">
        <SidebarContent email={email} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-60 border-r-2 border-foreground bg-surface shadow-none">
            <SidebarContent email={email} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b-2 border-foreground bg-background px-4">
          <button
            aria-label="Buka menu"
            className="border-2 border-foreground px-2 py-1 text-badan text-muted-foreground transition-colors hover:bg-muted md:hidden"
            onClick={() => setOpen(true)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-badan font-semibold uppercase tracking-tight text-foreground"
          >
            <span className="flex h-6 w-6 items-center justify-center bg-primary font-mono text-meta font-bold text-primary-foreground">
              H
            </span>
            <span className="hidden sm:inline">Heaviliate</span>
          </Link>
          <span aria-hidden="true" className="text-muted-foreground">
            ›
          </span>
          <Breadcrumb />
          <BudgetIndicator />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
