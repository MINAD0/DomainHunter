"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, Languages, Menu, PanelLeft } from "lucide-react";
import { useEffect, useState } from "react";
import {
  headerMeta,
  LANGUAGE_OPTIONS,
  primaryNavItems,
  settingsNavItem,
  workspaceHeaderChrome
} from "@/lib/workspace";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [language, setLanguage] = useState<(typeof LANGUAGE_OPTIONS)[number]["code"]>("en");
  const activeNavItem =
    [...primaryNavItems, settingsNavItem].find(
      (item) => pathname === item.href || item.aliases.includes(pathname)
    ) ?? primaryNavItems[0];
  const meta = headerMeta[activeNavItem.href] ?? headerMeta["/app"];
  const SettingsIcon = settingsNavItem.icon;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const savedLanguage = window.localStorage.getItem("domain-hunter-language");
    if (
      savedLanguage &&
      LANGUAGE_OPTIONS.some((option) => option.code === savedLanguage)
    ) {
      setLanguage(savedLanguage as (typeof LANGUAGE_OPTIONS)[number]["code"]);
      document.documentElement.lang = savedLanguage;
    }
  }, []);

  function updateLanguage(nextLanguage: (typeof LANGUAGE_OPTIONS)[number]["code"]) {
    setLanguage(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("domain-hunter-language", nextLanguage);
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLanguage;
    }
  }

  function cycleLanguage() {
    const currentIndex = LANGUAGE_OPTIONS.findIndex((option) => option.code === language);
    const nextOption = LANGUAGE_OPTIONS[(currentIndex + 1) % LANGUAGE_OPTIONS.length];
    updateLanguage(nextOption.code);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-mist text-ink">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[17.5rem] transform flex-col border-r border-cyan-300/10 bg-carbon text-white shadow-soft transition-transform duration-200 sm:w-72 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${desktopSidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full"} ${
          desktopSidebarOpen ? "lg:shadow-soft" : "lg:shadow-none"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-cyan-300/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-200/25 bg-blue text-carbon shadow-glow">
            <Globe2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/55 sm:text-sm">
              Domain Hunter
            </p>
            <p className="text-base font-semibold leading-tight text-white sm:text-lg">GeoDomains</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || item.aliases.includes(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] font-medium transition sm:text-sm ${
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
        <div className="border-t border-cyan-300/10 p-3">
          <Link
            href={settingsNavItem.href}
            onClick={() => setMobileOpen(false)}
            className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] font-medium transition sm:text-sm ${
              pathname === settingsNavItem.href || settingsNavItem.aliases.includes(pathname)
                ? "bg-blue text-carbon shadow-glow"
                : "text-cyan-50/72 hover:bg-cyan-300/10 hover:text-white"
            }`}
          >
            <SettingsIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{settingsNavItem.label}</span>
          </Link>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-carbon/55 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className={`min-w-0 transition-[padding] duration-200 ${
          desktopSidebarOpen ? "lg:pl-72" : "lg:pl-0"
        }`}
      >
        <header className={workspaceHeaderChrome.container}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              className={`${workspaceHeaderChrome.menuButton} lg:hidden`}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={desktopSidebarOpen ? "Hide side menu" : "Show side menu"}
              className="focus-ring hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-900/10 bg-white text-slate-500 transition hover:text-navy lg:flex"
              onClick={() => setDesktopSidebarOpen((current) => !current)}
            >
              <PanelLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <div className="min-w-0">
                <h2 className={workspaceHeaderChrome.title}>{meta.title}</h2>
                <p className={workspaceHeaderChrome.subtitle}>{meta.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-2 rounded-md border border-cyan-900/10 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 sm:flex">
              <Languages className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <select
                aria-label="Change language"
                className="bg-transparent text-[11px] font-medium text-slate-600 outline-none"
                value={language}
                onChange={(event) =>
                  updateLanguage(
                    event.target.value as (typeof LANGUAGE_OPTIONS)[number]["code"]
                  )
                }
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              aria-label="Change language"
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyan-900/10 bg-white text-slate-600 sm:hidden"
              onClick={cycleLanguage}
            >
              <Languages className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className={workspaceHeaderChrome.badgeRail}>
            <span className={workspaceHeaderChrome.badge}>Local-first</span>
            <span className={workspaceHeaderChrome.badge}>Docker</span>
            </div>
          </div>
        </header>
        <main className="w-full min-w-0 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
