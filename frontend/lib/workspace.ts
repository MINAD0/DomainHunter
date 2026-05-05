import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Gauge,
  ListChecks,
  Scale,
  ScrollText,
  Settings,
  Sparkles
} from "lucide-react";

export type WorkspaceNavItem = {
  href: string;
  aliases: string[];
  label: string;
  icon: LucideIcon;
};

export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "fr", label: "Francais" },
  { code: "ar", label: "Arabic" }
] as const;

export const primaryNavItems: WorkspaceNavItem[] = [
  { href: "/app", aliases: ["/"], label: "Dashboard", icon: Gauge },
  { href: "/app/generator", aliases: ["/generator"], label: "Geo Generator", icon: Sparkles },
  { href: "/app/scoring", aliases: ["/scoring"], label: "Scoring", icon: Scale },
  { href: "/app/results", aliases: ["/results"], label: "Results", icon: ListChecks },
  { href: "/app/saved", aliases: ["/saved"], label: "Saved Domains", icon: Bookmark },
  { href: "/app/logs", aliases: ["/logs"], label: "Logs", icon: ScrollText }
];

export const settingsNavItem: WorkspaceNavItem = {
  href: "/app/settings",
  aliases: ["/settings"],
  label: "Settings",
  icon: Settings
};

export const workspaceHeaderChrome = {
  container:
    "sticky top-0 z-10 flex min-h-[3.75rem] min-w-0 items-center justify-between gap-3 border-b border-cyan-900/10 bg-white/90 px-3 py-2 shadow-sm backdrop-blur sm:px-4 lg:px-6",
  menuButton:
    "focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-cyan-900/10 bg-white text-navy lg:hidden",
  iconBox:
    "hidden h-10 w-10 items-center justify-center rounded-md border border-cyan-900/10 bg-white text-blue lg:flex",
  eyebrow: "text-[10px] font-semibold uppercase tracking-[0.2em] text-blue/90",
  title: "truncate text-[0.95rem] font-semibold text-navy sm:text-base",
  subtitle: "hidden max-w-[38rem] truncate text-[13px] leading-5 text-slate-500 lg:block",
  badgeRail: "hidden items-center gap-2 xl:flex",
  badge:
    "rounded-full border border-cyan-900/10 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
} as const;

export const headerMeta: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
  "/app": {
    eyebrow: "Workspace",
    title: "Dashboard",
    subtitle: "Track scans, saved inventory, and recent availability runs."
  },
  "/app/generator": {
    eyebrow: "Workspace",
    title: "Domain Discovery",
    subtitle: "Generate geo domains, score them, and check live availability."
  },
  "/app/scoring": {
    eyebrow: "Workspace",
    title: "Scoring Studio",
    subtitle: "Review ranking rules and prepare the next scoring model iteration."
  },
  "/app/results": {
    eyebrow: "Workspace",
    title: "Results",
    subtitle: "Review available domains and push strong names into saved inventory."
  },
  "/app/saved": {
    eyebrow: "Workspace",
    title: "Saved Domains",
    subtitle: "Keep shortlist notes and export the domains worth revisiting."
  },
  "/app/settings": {
    eyebrow: "Workspace",
    title: "Settings",
    subtitle: "Manage AI providers, keys, and default scan behavior."
  },
  "/app/logs": {
    eyebrow: "Workspace",
    title: "Logs",
    subtitle: "Inspect provider activity, fallbacks, and run history."
  }
};
