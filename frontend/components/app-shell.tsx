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
  { href: "/app", aliases: ["/"], label: "Dashboard", icon: Gauge },
  { href: "/app/generator", aliases: ["/generator"], label: "Geo Generator", icon: Sparkles },
  { href: "/app/results", aliases: ["/results"], label: "Results", icon: ListChecks },
  { href: "/app/saved", aliases: ["/saved"], label: "Saved Domains", icon: Bookmark },
  { href: "/app/settings", aliases: ["/settings"], label: "Settings", icon: Settings },
  { href: "/app/logs", aliases: ["/logs"], label: "Logs", icon: ScrollText }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-mist text-ink">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 transform border-r border-cyan-300/10 bg-carbon text-white shadow-soft transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-cyan-300/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-200/25 bg-blue text-carbon shadow-glow">
            <Globe2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-100/55">
              Domain Hunter
            </p>
            <p className="text-lg font-semibold leading-tight text-white">GeoDomains</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || item.aliases.includes(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                  active
                    ? "bg-blue text-carbon shadow-glow"
                    : "text-cyan-50/72 hover:bg-cyan-300/10 hover:text-white"
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
          className="fixed inset-0 z-20 bg-carbon/55 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-10 flex h-16 min-w-0 items-center justify-between border-b border-cyan-900/10 bg-white/88 px-4 shadow-sm backdrop-blur lg:px-8">
          <button
            type="button"
            aria-label="Open menu"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-md border border-cyan-900/10 bg-white text-navy lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="hidden items-center gap-3 lg:flex">
            <ClipboardList className="h-5 w-5 text-blue" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-600">
              Local Docker domain discovery
            </span>
          </div>
          <Link
            href="/app/generator"
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md bg-blue px-3 text-sm font-semibold text-carbon shadow-glow transition hover:bg-sky-300 sm:px-4"
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
