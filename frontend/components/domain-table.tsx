"use client";

import { BookmarkPlus, Copy, ExternalLink } from "lucide-react";

import type { DomainResult, SettingsPayload } from "@/lib/api";
import { apiPost } from "@/lib/api";
import { buildRegistrarUrl } from "@/lib/domain";
import { AvailableBadge, buttonClass } from "@/components/ui";

export function DomainTable({
  domains,
  settings,
  onSaved
}: {
  domains: DomainResult[];
  settings: SettingsPayload | null;
  onSaved?: () => void;
}) {
  async function saveDomain(domain: DomainResult) {
    await apiPost("/saved", { ...domain, note: "" });
    onSaved?.();
  }

  if (!domains.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
        No available domains yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {["Domain", "City", "Niche", "TLD", "Status", "Score", "Actions"].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {domains.map((item) => (
            <tr key={`${item.domain}-${item.checked_at}`} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-navy">{item.domain}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.city}</td>
              <td className="px-4 py-3 text-slate-600">{item.niche}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.tld}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <AvailableBadge />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="font-semibold text-navy">{item.score}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Copy"
                    aria-label={`Copy ${item.domain}`}
                    className={`${buttonClass} border border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-100`}
                    onClick={() => navigator.clipboard.writeText(item.domain)}
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    title="Save"
                    aria-label={`Save ${item.domain}`}
                    className={`${buttonClass} border border-emerald-200 bg-emerald-50 px-3 text-emerald-800 hover:bg-emerald-100`}
                    onClick={() => saveDomain(item)}
                  >
                    <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <a
                    title="Open registrar"
                    aria-label={`Open registrar for ${item.domain}`}
                    className={`${buttonClass} border border-blue-200 bg-blue-50 px-3 text-blue hover:bg-blue-100`}
                    href={buildRegistrarUrl(settings, item.domain)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

