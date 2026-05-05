import Link from "next/link";

import { ctaLinks, marketingNav } from "@/lib/site-content";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-body min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--marketing-border)] bg-[rgba(248,243,235,0.82)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="min-h-11 text-left">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[#8f6728]">
              Domain Hunter
            </p>
            <p className="marketing-display text-lg text-[var(--marketing-deep)]">Opportunity-aware discovery</p>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {marketingNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[var(--marketing-muted)] transition hover:text-[var(--marketing-deep)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href={ctaLinks.workspace.href}
            className="inline-flex min-h-11 items-center rounded-[8px] border border-[rgba(187,138,60,0.24)] bg-white/72 px-4 text-sm font-semibold text-[var(--marketing-deep)] transition hover:bg-white"
          >
            {ctaLinks.workspace.label}
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-[var(--marketing-border)] bg-[rgba(255,253,249,0.55)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-[var(--marketing-muted)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Domain Hunter is built for solo operators who want better names, less noise, and more timing advantage.</p>
          <div className="flex flex-wrap gap-5">
            {marketingNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-[var(--marketing-deep)]">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
