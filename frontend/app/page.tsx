"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, CheckCircle2, Clock3, Database } from "lucide-react";
import { useEffect, useState } from "react";

import type { DashboardStats } from "@/lib/api";
import { apiGet } from "@/lib/api";
import { PageTitle, Panel, StatusMessage, buttonClass } from "@/components/ui";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<DashboardStats>("/dashboard").then(setStats).catch((err) => setError(String(err)));
  }, []);

  const cards = [
    {
      label: "Total domains generated",
      value: stats?.total_domains_generated ?? 0,
      icon: Database
    },
    {
      label: "Available domains found",
      value: stats?.available_domains_found ?? 0,
      icon: CheckCircle2
    },
    {
      label: "Last scan",
      value: stats?.last_scan ? new Date(stats.last_scan).toLocaleString() : "None",
      icon: Clock3
    },
    {
      label: "Top saved domains",
      value: stats?.top_saved_domains.length ?? 0,
      icon: Bookmark
    }
  ];

  return (
    <>
      <PageTitle
        eyebrow="Dashboard"
        title="Domain Hunter"
        actions={
          <Link className={`${buttonClass} bg-navy text-white hover:bg-slate-800`} href="/generator">
            Start scan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      {error ? <StatusMessage type="error">{error}</StatusMessage> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Panel key={card.label} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-navy">{card.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">Top saved domains</h2>
            <Link className="text-sm font-semibold text-blue hover:underline" href="/saved">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.top_saved_domains.length ? (
              stats.top_saved_domains.map((item) => (
                <div
                  key={item.domain}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-3"
                >
                  <div>
                    <p className="font-semibold text-navy">{item.domain}</p>
                    <p className="text-sm text-slate-500">{item.city} · score {item.score}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    Saved
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                Saved domains will appear here.
              </p>
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-lg font-semibold text-navy">Run order</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {["Add API keys", "Choose country, cities, niche, and TLDs", "Generate and check", "Save or export"].map(
              (item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue/10 text-xs font-semibold text-blue">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </div>
              )
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

