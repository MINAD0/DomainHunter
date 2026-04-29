import Link from "next/link";
import { ArrowRight, Clock3, Command, Crown, Sparkles, Target } from "lucide-react";

import {
  ctaLinks,
  heroPreviewLines,
  homepageHighlights,
  homepageSections,
  homepageStats,
  quickStartCommands,
  valuePillars
} from "@/lib/site-content";

const sectionIcons = [Clock3, Sparkles, Crown, Command] as const;

export default function MarketingHomePage() {
  return (
    <main>
      <section className="border-b border-white/8">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-[8px] border border-[#c6a96f]/30 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d4b06f]">
              <Target className="h-3.5 w-3.5" />
              Premium discovery workflow for solo domain hunters
            </p>

            <h1 className="marketing-display max-w-4xl text-5xl leading-[0.96] text-[#f5efe4] sm:text-6xl lg:text-7xl">
              Catch open domains before the market notices.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#cbc3b6] sm:text-lg">
              Domain Hunter turns long search sessions into a tighter operating loop. Generate sharper candidates, check availability
              through your provider chain, and stay focused on names that still have room to become something valuable.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={ctaLinks.primary.href}
                className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-[#d3af73] px-5 text-sm font-semibold text-[#140f09] transition hover:bg-[#dfbf89]"
              >
                {ctaLinks.primary.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={ctaLinks.secondary.href}
                className="inline-flex min-h-11 items-center rounded-[8px] border border-white/12 px-5 text-sm font-semibold text-[#f5efe4] transition hover:bg-white/5"
              >
                {ctaLinks.secondary.label}
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {homepageStats.map((stat) => (
                <div key={stat.label} className="rounded-[8px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-2xl font-semibold text-[#f5efe4]">{stat.value}</p>
                  <p className="mt-1 text-sm text-[#aea596]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="marketing-panel self-stretch">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-[#d4b06f]">Workflow Preview</p>
                <p className="mt-1 text-sm text-[#ece3d3]">Outcome-focused local run</p>
              </div>
              <div className="flex gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#d3af73]" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
              </div>
            </div>

            <div className="grid gap-5 px-5 py-5">
              <div className="rounded-[8px] border border-white/8 bg-[#0d0b08] p-4 font-mono text-sm text-[#ece5d8]">
                {heroPreviewLines.map((line) => (
                  <p key={line} className="leading-7">
                    {line}
                  </p>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "brandable candidates stay readable",
                  "API-first provider chain keeps checks tighter",
                  "open names are saved without clutter",
                  "AI ideas stay optional, not the whole story"
                ].map((item) => (
                  <div key={item} className="rounded-[8px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[#cec6ba]">
                    {item}
                  </div>
                ))}
              </div>

              <div className="rounded-[8px] border border-[#d3af73]/20 bg-[linear-gradient(135deg,rgba(211,175,115,0.12),rgba(255,255,255,0.02))] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d4b06f]">Value Signal</p>
                <p className="mt-3 text-lg text-[#f5efe4]">
                  Spend less time proving names are unavailable, and more time deciding whether the open ones are worth acting on.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#cba86c]">Why it works</p>
            <h2 className="marketing-display mt-4 text-4xl leading-tight text-[#f5efe4] sm:text-5xl">
              A tighter hunt creates better timing.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-[#c3bbaf]">
              The strongest domain opportunities rarely come from searching longer. They come from running a cleaner process and noticing
              open names before the market fully crowds the space.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {homepageHighlights.map((item) => (
              <article key={item.title} className="rounded-[8px] border border-white/8 bg-white/[0.03] p-5">
                <h3 className="marketing-display text-2xl leading-tight text-[#f3ecdf]">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#bdb5a8]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {homepageSections.map((section, index) => {
        const Icon = sectionIcons[index];
        const isFinal = section.id === "get-started";

        return (
          <section
            key={section.id}
            id={section.id}
            className={`border-t border-white/8 ${isFinal ? "bg-[rgba(255,248,238,0.03)]" : ""}`}
          >
            <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-[8px] border border-[#cba86c]/30 bg-white/[0.03] text-[#d4b06f]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#cba86c]">{section.eyebrow}</p>
                <h2 className="marketing-display mt-3 text-4xl leading-tight text-[#f5efe4]">{section.title}</h2>
              </div>

              <div className="space-y-6">
                <p className="max-w-2xl text-base leading-8 text-[#c8c0b3]">{section.body}</p>

                {section.id === "workflow-edge" ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {valuePillars.map((pillar) => (
                      <div key={pillar.title} className="rounded-[8px] border border-white/8 bg-white/[0.03] p-5">
                        <h3 className="text-base font-semibold text-[#f3ecdf]">{pillar.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-[#bdb5a8]">{pillar.body}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {section.id === "get-started" ? (
                  <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[8px] border border-white/8 bg-white/[0.03] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d4b06f]">Start locally</p>
                      <div className="mt-4 space-y-4">
                        {[
                          quickStartCommands.install,
                          quickStartCommands.firstRun,
                          quickStartCommands.cliExample
                        ].map((command) => (
                          <div key={command.label}>
                            <p className="mb-2 text-sm font-semibold text-[#f5efe4]">{command.label}</p>
                            <pre className="marketing-command overflow-x-auto whitespace-pre-wrap rounded-[8px] border border-white/8 px-4 py-3 text-sm text-[#e7dfd2]">
                              {command.command}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[8px] border border-[#d3af73]/20 bg-[linear-gradient(180deg,rgba(211,175,115,0.12),rgba(255,255,255,0.03))] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d4b06f]">Get Started Flow</p>
                      <div className="mt-5 space-y-4">
                        {[
                          "Install the dependencies and open the interactive menu.",
                          "Choose a niche, keyword set, and TLD mix that reflects the market you are targeting.",
                          "Run the checks and review only the open names before tightening the next search."
                        ].map((step, stepIndex) => (
                          <div key={step} className="flex gap-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#100d09] text-sm font-semibold text-[#d4b06f]">
                              {stepIndex + 1}
                            </div>
                            <p className="pt-1 text-sm leading-7 text-[#f2eadf]">{step}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          href="/how-to-use"
                          className="inline-flex min-h-11 items-center rounded-[8px] bg-[#100d09] px-4 text-sm font-semibold text-[#f5efe4] transition hover:bg-[#18130d]"
                        >
                          Open the complete guide
                        </Link>
                        <Link
                          href="/app"
                          className="inline-flex min-h-11 items-center rounded-[8px] border border-white/12 px-4 text-sm font-semibold text-[#f5efe4] transition hover:bg-white/5"
                        >
                          Enter the workspace
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        );
      })}
    </main>
  );
}
