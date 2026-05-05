import Link from "next/link";
import { ArrowUpRight, Cpu, FileText, WandSparkles } from "lucide-react";

import { guideSections, marketingNav } from "@/lib/site-content";

export default function HowToUsePage() {
  return (
    <main className="text-[var(--marketing-ink)]">
      <section className="border-b border-[var(--marketing-border)] bg-[linear-gradient(180deg,#f7f2ea_0%,#f0ece5_100%)]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-18">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#8f6728]">How to Use</p>
            <h1 className="marketing-display mt-4 text-5xl leading-[0.96] text-[var(--marketing-deep)] sm:text-6xl">
              A cleaner guide for turning setup into sharper hunts.
            </h1>
          </div>

          <div className="marketing-shell p-6">
            <p className="text-base leading-8 text-[var(--marketing-muted)]">
              This page is meant to be practical, not dense. Start with the first run, move into direct CLI usage when the flow feels
              natural, then layer in AI generation and provider tuning only where they make the hunt better.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/#get-started"
                className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-[var(--marketing-deep)] px-4 text-sm font-semibold text-white transition hover:bg-[#1b2735]"
              >
                Back to Get Started
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/app"
                className="inline-flex min-h-11 items-center rounded-[8px] border border-[var(--marketing-border)] bg-white px-4 text-sm font-semibold text-[var(--marketing-deep)] transition hover:bg-[var(--marketing-surface)]"
              >
                Open Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 lg:py-16">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="marketing-shell p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8f6728]">Guide Contents</p>
            <nav className="mt-4 space-y-2">
              {guideSections.map((section) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-[8px] px-3 py-2 text-sm font-medium text-[var(--marketing-muted)] transition hover:bg-[var(--marketing-surface)] hover:text-[var(--marketing-deep)]"
                >
                  {section.title}
                </Link>
              ))}
            </nav>
            <div className="mt-6 rounded-[8px] bg-[var(--marketing-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--marketing-deep)]">Page Map</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--marketing-muted)]">
                {marketingNav.map((item) => (
                  <Link key={item.href} href={item.href} className="block hover:text-[var(--marketing-deep)]">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {guideSections.map((section, index) => {
            const Icon = index === 0 ? FileText : index < 5 ? Cpu : WandSparkles;

            return (
              <section key={section.id} id={section.id} className="marketing-shell p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8f6728]">{section.summary}</p>
                    <h2 className="marketing-display mt-3 text-3xl text-[var(--marketing-deep)] sm:text-4xl">{section.title}</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[var(--marketing-surface)] text-[#8f6728]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4 text-[15px] leading-8 text-[var(--marketing-muted)]">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                {section.command ? (
                  <pre className="guide-command mt-6 overflow-x-auto whitespace-pre-wrap rounded-[8px] border border-[var(--marketing-border)] bg-[var(--marketing-deep)] px-4 py-4 text-sm leading-7 text-[#eef2f6]">
                    {section.command}
                  </pre>
                ) : null}

                {section.bullets ? (
                  <div className="mt-6 grid gap-3">
                    {section.bullets.map((bullet) => (
                      <div key={bullet} className="rounded-[8px] border border-[var(--marketing-border)] bg-[var(--marketing-surface)] px-4 py-3 text-sm leading-7 text-[var(--marketing-muted)]">
                        {bullet}
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
