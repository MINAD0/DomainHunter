import Link from "next/link";
import { ArrowUpRight, Cpu, FileText, WandSparkles } from "lucide-react";

import { guideSections, marketingNav } from "@/lib/site-content";

export default function HowToUsePage() {
  return (
    <main className="bg-[linear-gradient(180deg,#16110d_0%,#1d1711_14%,#f3ede4_14.1%,#f6f2eb_100%)] text-[#241d16]">
      <section className="border-b border-white/8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#d4b06f]">How to Use</p>
            <h1 className="marketing-display mt-4 text-5xl leading-[0.98] text-[#f4ede2] sm:text-6xl">
              A complete guide for moving from setup to sharper hunts.
            </h1>
          </div>

          <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5 text-[#d7d0c4]">
            <p className="text-base leading-8">
              This guide stays practical. Install the tool, run the interactive flow, move into direct CLI usage when you are ready, then
              layer in AI generation, provider tuning, and a more disciplined hunting rhythm.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/#get-started"
                className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-[#d3af73] px-4 text-sm font-semibold text-[#160f09] transition hover:bg-[#dfbf89]"
              >
                Back to Get Started
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/app"
                className="inline-flex min-h-11 items-center rounded-[8px] border border-white/12 px-4 text-sm font-semibold text-[#f5efe4] transition hover:bg-white/5"
              >
                Open Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 lg:py-16">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[8px] border border-[#d8c9b4] bg-white p-5 shadow-[0_18px_50px_rgba(19,15,10,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8f6a2f]">Guide Contents</p>
              <nav className="mt-4 space-y-2">
                {guideSections.map((section) => (
                  <Link
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-[8px] px-3 py-2 text-sm font-medium text-[#4c4032] transition hover:bg-[#f4ecdf] hover:text-[#211a13]"
                  >
                    {section.title}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 rounded-[8px] bg-[#f6efe4] p-4">
                <p className="text-sm font-semibold text-[#2f241a]">Page Map</p>
                <div className="mt-3 space-y-2 text-sm text-[#5f5243]">
                  {marketingNav.map((item) => (
                    <Link key={item.href} href={item.href} className="block hover:text-[#20170f]">
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
                <section
                  key={section.id}
                  id={section.id}
                  className="rounded-[8px] border border-[#e0d4c3] bg-white p-6 shadow-[0_18px_50px_rgba(19,15,10,0.06)] sm:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8f6a2f]">{section.summary}</p>
                      <h2 className="marketing-display mt-3 text-3xl text-[#221a12] sm:text-4xl">{section.title}</h2>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#f4ecdf] text-[#8f6a2f]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4 text-[15px] leading-8 text-[#4f4336]">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>

                  {section.command ? (
                    <pre className="guide-command mt-6 overflow-x-auto whitespace-pre-wrap rounded-[8px] border border-[#e2d5c5] bg-[#1b140f] px-4 py-4 text-sm leading-7 text-[#f2eadf]">
                      {section.command}
                    </pre>
                  ) : null}

                  {section.bullets ? (
                    <div className="mt-6 grid gap-3">
                      {section.bullets.map((bullet) => (
                        <div key={bullet} className="rounded-[8px] border border-[#ebdfcf] bg-[#fbf7f1] px-4 py-3 text-sm leading-7 text-[#56493c]">
                          {bullet}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
