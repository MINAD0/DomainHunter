import Link from "next/link";
import { ArrowRight, Command, Target } from "lucide-react";

import {
  ctaLinks,
  heroPreviewLines,
  homepageStats,
  homepageSections,
  quickStartCommands
} from "@/lib/site-content";

export default function MarketingHomePage() {
  const getStarted = homepageSections[0];

  return (
    <main className="text-[var(--marketing-ink)]">
      <section className="marketing-hero border-b border-[var(--marketing-border)]">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="marketing-chip mb-5 inline-flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
              <Target className="h-3.5 w-3.5" />
              Solo domain hunters
            </p>

            <h1 className="marketing-display max-w-4xl text-5xl leading-[0.95] text-[var(--marketing-deep)] sm:text-6xl lg:text-7xl">
              Find open domains before everyone else gets there.
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-8 text-[var(--marketing-muted)]">
              Generate tighter ideas, check availability faster, and stay focused on names that are still open.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={ctaLinks.primary.href}
                className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-[var(--marketing-deep)] px-5 text-sm font-semibold text-white transition hover:bg-[#1d2b39]"
              >
                {ctaLinks.primary.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={ctaLinks.secondary.href}
                className="inline-flex min-h-11 items-center rounded-[8px] border border-[var(--marketing-border)] bg-white/80 px-5 text-sm font-semibold text-[var(--marketing-deep)] transition hover:bg-white"
              >
                {ctaLinks.secondary.label}
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {homepageStats.map((stat) => (
                <div key={stat.label} className="marketing-soft-card p-4">
                  <p className="text-3xl font-semibold text-[var(--marketing-deep)]">{stat.value}</p>
                  <p className="mt-1 text-sm text-[var(--marketing-muted)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="marketing-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--marketing-border)] px-6 py-5">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#7f6a48]">Live Workflow</p>
                <p className="mt-1 text-sm text-[var(--marketing-muted)]">One tighter loop from idea to open name</p>
              </div>
              <Command className="h-5 w-5 text-[var(--marketing-accent)]" />
            </div>

            <div className="grid gap-5 px-6 py-6">
              <div className="marketing-dark-stage px-5 py-5 text-sm text-[#eef3f8]">
                {heroPreviewLines.map((line, index) => (
                  <p key={line} className={`leading-8 ${index === 0 ? "text-white" : "text-[#d6dde6]"}`}>
                    {line}
                  </p>
                ))}
              </div>

              <div className="rounded-[8px] border border-[var(--marketing-border)] bg-white/74 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8f6728]">What changes</p>
                <p className="mt-3 text-base leading-8 text-[var(--marketing-deep)]">
                  Less time proving names are unavailable. More time deciding which open names are worth moving on.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id={getStarted.id} className="border-t border-[var(--marketing-border)] bg-[rgba(255,252,247,0.6)]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8f6728]">{getStarted.eyebrow}</p>
            <h2 className="marketing-display mt-3 text-4xl leading-tight text-[var(--marketing-deep)]">{getStarted.title}</h2>
            <p className="mt-4 text-base leading-8 text-[var(--marketing-muted)]">{getStarted.body}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="marketing-soft-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8f6728]">Start locally</p>
              <div className="mt-4 space-y-4">
                {[quickStartCommands.install, quickStartCommands.firstRun].map((command) => (
                  <div key={command.label}>
                    <p className="mb-2 text-sm font-semibold text-[var(--marketing-deep)]">{command.label}</p>
                    <pre className="marketing-command overflow-x-auto whitespace-pre-wrap rounded-[8px] border border-[var(--marketing-border)] bg-[var(--marketing-surface-strong)] px-4 py-3 text-sm text-[var(--marketing-deep)]">
                      {command.command}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            <div className="marketing-soft-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8f6728]">Quick path</p>
              <div className="mt-4 space-y-4">
                {[
                  "Install the tool and open the interactive menu.",
                  "Run a focused search with a niche and TLD mix.",
                  "Review the open names and refine the next pass."
                ].map((step, stepIndex) => (
                  <div key={step} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-deep)] text-sm font-semibold text-white">
                      {stepIndex + 1}
                    </div>
                    <p className="pt-1 text-sm leading-7 text-[var(--marketing-muted)]">{step}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/how-to-use"
                  className="inline-flex min-h-11 items-center rounded-[8px] bg-[var(--marketing-deep)] px-4 text-sm font-semibold text-white transition hover:bg-[#1d2b39]"
                >
                  Open the complete guide
                </Link>
                <Link
                  href="/app"
                  className="inline-flex min-h-11 items-center rounded-[8px] border border-[var(--marketing-border)] bg-white px-4 text-sm font-semibold text-[var(--marketing-deep)] transition hover:bg-[var(--marketing-surface)]"
                >
                  Enter the workspace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
