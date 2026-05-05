"use client";

import { Scale, SlidersHorizontal } from "lucide-react";

import { PageTitle, Panel } from "@/components/ui";

const upcomingTracks = [
  "Tune weights for TLD quality, geo relevance, niche coverage, and readability.",
  "Compare candidate domains side by side before we finalize the scoring model.",
  "Add penalties for filler words and weak lead-gen phrasing that hurts resale value."
];

export default function ScoringPage() {
  return (
    <>
      <PageTitle eyebrow="Scoring" title="Scoring model workbench" />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Panel className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue/10 text-blue">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-navy sm:text-lg">Coming next</h2>
              <p className="mt-1 text-sm text-slate-600">
                This page is the placeholder for the scoring feature. We will use it to make the
                ranking model more accurate and easier to tune without touching raw code each time.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {upcomingTracks.map((item) => (
              <div
                key={item}
                className="rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-accent">
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy sm:text-lg">Planned controls</h2>
              <p className="mt-1 text-sm text-slate-600">
                Weight sliders, pattern bonuses, penalty rules, and example score previews will
                live here once we move into the scoring iteration.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
