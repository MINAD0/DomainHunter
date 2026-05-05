"use client";

import { BookmarkPlus, ChevronLeft, ChevronRight, Copy, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { DomainResult, SettingsPayload } from "@/lib/api";
import { apiPost } from "@/lib/api";
import {
  copyDomainErrorMessage,
  copyDomainMessage,
  copyDomainWithFallback,
  saveDomainMessage
} from "@/lib/domain-actions";
import { buildRegistrarUrl } from "@/lib/domain";
import { paginateItems } from "@/lib/pagination";
import { AvailableBadge, StatusMessage, buttonClass } from "@/components/ui";

const PAGE_SIZE = 8;

export function DomainTable({
  domains,
  settings,
  onSaved
}: {
  domains: DomainResult[];
  settings: SettingsPayload | null;
  onSaved?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingDomain, setSavingDomain] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const pagination = useMemo(() => paginateItems(domains, page, PAGE_SIZE), [domains, page]);

  useEffect(() => {
    setPage((currentPage) =>
      Math.min(currentPage, Math.max(1, Math.ceil(domains.length / PAGE_SIZE)))
    );
  }, [domains.length]);

  async function saveDomain(domain: DomainResult) {
    setError("");
    setMessage("");
    setSavingDomain(domain.domain);
    try {
      await apiPost("/saved", { ...domain, note: "" });
      setMessage(saveDomainMessage(domain.domain));
      onSaved?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setSavingDomain(null);
    }
  }

  async function copyDomain(domain: string) {
    setError("");
    setMessage("");
    const copied = await copyDomainWithFallback({
      clipboard: typeof navigator !== "undefined" ? navigator.clipboard : undefined,
      domain,
      fallback: fallbackCopyToClipboard
    });

    if (copied) {
      setMessage(copyDomainMessage(domain));
      return;
    }
    try {
      if (typeof window !== "undefined") {
        window.prompt("Copy this domain:", domain);
      }
      setMessage(copyDomainMessage(domain));
    } catch {
      setError(copyDomainErrorMessage(domain));
    }
  }

  if (!domains.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
        No available domains yet.
      </div>
    );
  }

  return (
    <div>
      {message || error ? (
        <div className="space-y-3 px-4 pt-4">
          {message ? <StatusMessage type="success">{message}</StatusMessage> : null}
          {error ? <StatusMessage type="error">{error}</StatusMessage> : null}
        </div>
      ) : null}

      <div className="divide-y divide-slate-200 xl:hidden">
        {pagination.pageItems.map((item) => (
          <div key={`${item.domain}-${item.checked_at}`} className="space-y-4 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all text-base font-semibold text-navy">{item.domain}</p>
                <p className="mt-1 text-sm text-slate-500">{`${item.city} - ${item.niche}`}</p>
              </div>
              <AvailableBadge />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 bg-slate-50/80 p-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">TLD</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{item.tld}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Score</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{item.score}</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-100`}
                onClick={() => copyDomain(item.domain)}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy
              </button>
              <button
                type="button"
                className={`${buttonClass} border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
                onClick={() => saveDomain(item)}
                disabled={savingDomain === item.domain}
              >
                <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                {savingDomain === item.domain ? "Saving" : "Save"}
              </button>
              <a
                className={`${buttonClass} border border-blue-200 bg-blue-50 text-blue hover:bg-blue-100`}
                href={buildRegistrarUrl(settings, item.domain)}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Registrar
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Domain", "City", "Niche", "TLD", "Status", "Score", "Actions"].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {pagination.pageItems.map((item) => (
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
                      className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
                      onClick={() => copyDomain(item.domain)}
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      title="Save"
                      aria-label={`Save ${item.domain}`}
                      className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => saveDomain(item)}
                      disabled={savingDomain === item.domain}
                    >
                      <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <a
                      title="Open registrar"
                      aria-label={`Open registrar for ${item.domain}`}
                      className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue transition hover:bg-blue-100"
                      href={buildRegistrarUrl(settings, item.domain)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 ? (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {(pagination.currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(pagination.currentPage * PAGE_SIZE, domains.length)}
            </span>{" "}
            of <span className="font-medium text-slate-700">{domains.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="focus-ring inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Prev
            </button>
            <span className="min-w-20 text-center text-sm font-medium text-slate-600">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              type="button"
              className="focus-ring inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() =>
                setPage((currentPage) =>
                  Math.min(pagination.totalPages, currentPage + 1)
                )
              }
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function fallbackCopyToClipboard(text: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
