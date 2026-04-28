"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  ClipboardList,
  Gauge,
  Globe2,
  ListChecks,
  Menu,
  ScrollText,
  Settings,
  Sparkles
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/generator", label: "Geo Generator", icon: Sparkles },
  { href: "/results", label: "Results", icon: ListChecks },
  { href: "/saved", label: "Saved Domains", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/logs", label: "Logs", icon: ScrollText }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-mist text-ink">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-navy text-white shadow-soft transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
            <Globe2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
              Domain Hunter
            </p>
            <p className="text-lg font-semibold leading-tight">GeoDomains</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                  active
                    ? "bg-white text-navy"
                    : "text-white/78 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-navy/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-10 flex h-16 min-w-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-8">
          <button
            type="button"
            aria-label="Open menu"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-navy lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="hidden items-center gap-3 lg:flex">
            <ClipboardList className="h-5 w-5 text-accent" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-600">
              Local Docker domain discovery
            </span>
          </div>
          <Link
            href="/generator"
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:px-4"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Generate</span>
          </Link>
        </header>
        <main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
