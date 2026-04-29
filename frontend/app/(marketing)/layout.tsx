import Link from "next/link";

import { ctaLinks, marketingNav } from "@/lib/site-content";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-body min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(10,8,6,0.78)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="min-h-11 text-left">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[#d4b06f]">
              Domain Hunter
            </p>
            <p className="marketing-display text-lg text-[#f3ecdf]">Opportunity-aware discovery</p>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {marketingNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#d7d0c4] transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href={ctaLinks.workspace.href}
            className="inline-flex min-h-11 items-center rounded-[8px] border border-[#c8a768]/40 px-4 text-sm font-semibold text-[#f5efe4] transition hover:border-[#d7ba86] hover:bg-white/5"
          >
            {ctaLinks.workspace.label}
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-[#b7afa2] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Domain Hunter is built for solo operators who want better names, less noise, and more timing advantage.</p>
          <div className="flex flex-wrap gap-5">
            {marketingNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
