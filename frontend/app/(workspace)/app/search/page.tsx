"use client";

import Link from "next/link";
import { ExternalLink, Loader2, Search, SearchCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
  BulkDomainSearchResponse,
  DomainSearchResponse,
  DomainSearchResult,
  RegistrarOffer,
  SettingsPayload
} from "@/lib/api";
import { apiGet, apiPost } from "@/lib/api";
import { formatOfferPrice, normalizeSearchDomainInput, parseBulkDomainInput } from "@/lib/domain-search";
import { emptySettings } from "@/lib/domain";
import { hasAnyConfiguredOfficialSearchProvider } from "@/lib/settings";
import { PageTitle, Panel, StatusMessage, buttonClass, inputClass } from "@/components/ui";

type SearchMode = "single" | "bulk";

export default function SearchPage() {
  const [mode, setMode] = useState<SearchMode>("single");
  const [singleDomain, setSingleDomain] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [singleResult, setSingleResult] = useState<DomainSearchResult | null>(null);
  const [bulkResults, setBulkResults] = useState<DomainSearchResult[]>([]);
  const [settings, setSettings] = useState<SettingsPayload>(emptySettings());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const bulkPreviewCount = useMemo(() => parseBulkDomainInput(bulkInput).length, [bulkInput]);
  const officialProvidersConfigured = useMemo(
    () => hasAnyConfiguredOfficialSearchProvider(settings),
    [settings]
  );

  useEffect(() => {
    apiGet<SettingsPayload>("/settings")
      .then((data) => setSettings(data))
      .catch(() => setSettings(emptySettings()));
  }, []);

  async function runSingleSearch() {
    const normalized = normalizeSearchDomainInput(singleDomain);
    if (!normalized) {
      setError("Enter a domain to search.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await apiPost<DomainSearchResponse>("/search-domain", {
        domain: normalized
      });
      setSingleResult(response.result);
      setBulkResults([]);
      setMessage(
        response.result.best_offer?.price !== null
          ? `Best live offer found for ${response.result.domain}.`
          : `Availability checked for ${response.result.domain}.`
      );
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function runBulkSearch() {
    const domains = parseBulkDomainInput(bulkInput);
    if (!domains.length) {
      setError("Add at least one domain to bulk search.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await apiPost<BulkDomainSearchResponse>("/search-domains", { domains });
      setBulkResults(response.results);
      setSingleResult(null);
      setMessage(`Checked ${response.results.length} domains across the configured providers.`);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageTitle eyebrow="Domain Search" title="Search live domain offers" />

      {!officialProvidersConfigured ? (
        <div className="mb-4">
          <StatusMessage type="error">
            No official registrar API is configured yet. Search can still use fallback checks, but live pricing works best after adding provider keys in{" "}
            <Link className="font-semibold underline" href="/app/settings">
              Settings
            </Link>
            .
          </StatusMessage>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,_1fr)] 2xl:grid-cols-[25rem_minmax(0,_1fr)]">
        <Panel className="p-4 sm:p-5">
          <div className="space-y-4">
            <div className="inline-flex rounded-md border border-cyan-900/10 bg-slate-50 p-1">
              <ModeButton
                active={mode === "single"}
                label="Single Search"
                onClick={() => setMode("single")}
              />
              <ModeButton
                active={mode === "bulk"}
                label="Bulk Search"
                onClick={() => setMode("bulk")}
              />
            </div>

            {mode === "single" ? (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700 sm:text-sm">
                    Domain
                  </span>
                  <input
                    className={inputClass}
                    value={singleDomain}
                    onChange={(event) => setSingleDomain(event.target.value)}
                    placeholder="exampledomain.com"
                  />
                </label>
                <button
                  type="button"
                  className={`${buttonClass} w-full bg-blue text-carbon shadow-glow hover:bg-sky-300`}
                  onClick={runSingleSearch}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Search className="h-4 w-4" aria-hidden="true" />
                  )}
                  Search best offer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700 sm:text-sm">
                    Domains
                  </span>
                  <textarea
                    className={`${inputClass} min-h-48 resize-y py-3`}
                    value={bulkInput}
                    onChange={(event) => setBulkInput(event.target.value)}
                    placeholder={"exampledomain.com\nseconddomain.net\nthirddomain.org"}
                  />
                </label>
                <div className="rounded-md border border-cyan-900/10 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {bulkPreviewCount} domains ready
                </div>
                <button
                  type="button"
                  className={`${buttonClass} w-full bg-blue text-carbon shadow-glow hover:bg-sky-300`}
                  onClick={runBulkSearch}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <SearchCheck className="h-4 w-4" aria-hidden="true" />
                  )}
                  Run bulk search
                </button>
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          {loading ? <StatusMessage type="loading">Checking providers...</StatusMessage> : null}
          {message ? <StatusMessage type="success">{message}</StatusMessage> : null}
          {error ? <StatusMessage type="error">{error}</StatusMessage> : null}

          {mode === "single" ? (
            <SingleSearchResultPanel result={singleResult} />
          ) : (
            <BulkSearchResultPanel results={bulkResults} />
          )}
        </div>
      </div>
    </>
  );
}

function ModeButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`focus-ring inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold transition ${
        active ? "bg-white text-navy shadow-sm" : "text-slate-600 hover:text-navy"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function SingleSearchResultPanel({ result }: { result: DomainSearchResult | null }) {
  if (!result) {
    return (
      <Panel className="px-4 py-10 text-center text-sm text-slate-500">
        No single-search result yet.
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue">Domain</p>
            <h2 className="mt-1 break-all text-xl font-semibold text-navy">{result.domain}</h2>
          </div>
          <OfferStatusBadge status={result.available ? "AVAILABLE" : "UNKNOWN"} />
        </div>
        {result.best_offer ? (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-900">
              {result.best_offer.price !== null ? "Best offer" : "Best available source"}
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold capitalize text-navy">
                  {result.best_offer.provider}
                </p>
                <p className="text-sm text-slate-600">
                  {offerSummary(result.best_offer)}
                </p>
              </div>
              {result.best_offer.purchase_url ? (
                <a
                  className={`${buttonClass} bg-navy px-4 text-white hover:bg-graphite`}
                  href={result.best_offer.purchase_url}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Open offer
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-semibold text-navy">Provider comparison</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {result.offers.map((offer) => (
            <div key={`${result.domain}-${offer.provider}`} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,_1fr)_auto_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold capitalize text-navy">{offer.provider}</p>
                  {offer.is_best ? (
                    <span className="rounded-full bg-blue/12 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue">
                      Best
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {offerSummary(offer)}
                </p>
              </div>
              <div className="justify-self-start lg:justify-self-center">
                <OfferStatusBadge status={offer.status} />
              </div>
              {offer.purchase_url ? (
                <a
                  className={`${buttonClass} justify-self-start border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:justify-self-end`}
                  href={offer.purchase_url}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Open
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function BulkSearchResultPanel({ results }: { results: DomainSearchResult[] }) {
  if (!results.length) {
    return (
      <Panel className="px-4 py-10 text-center text-sm text-slate-500">
        No bulk-search result yet.
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-semibold text-navy">Bulk search results</h3>
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Domain", "Best Provider", "Price", "Status", "Action"].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {results.map((result) => (
              <tr key={result.domain}>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-navy">
                  {result.domain}
                </td>
                <td className="whitespace-nowrap px-4 py-3 capitalize text-slate-600">
                  {result.best_offer?.provider ?? "No offer"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {result.best_offer
                    ? formatOfferPrice(result.best_offer.price, result.best_offer.currency)
                    : "Unavailable"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <OfferStatusBadge status={result.best_offer?.status ?? "UNKNOWN"} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {result.best_offer?.purchase_url ? (
                    <a
                      className={`${buttonClass} border border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-50`}
                      href={result.best_offer.purchase_url}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Open
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-200 lg:hidden">
        {results.map((result) => (
          <div key={result.domain} className="space-y-3 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all text-base font-semibold text-navy">{result.domain}</p>
                <p className="mt-1 text-sm capitalize text-slate-600">
                  {result.best_offer?.provider ?? "No offer"}
                </p>
              </div>
              <OfferStatusBadge status={result.best_offer?.status ?? "UNKNOWN"} />
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {result.best_offer
                ? formatOfferPrice(result.best_offer.price, result.best_offer.currency)
                : "Live price unavailable"}
            </div>
            {result.best_offer?.purchase_url ? (
              <a
                className={`${buttonClass} w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
                href={result.best_offer.purchase_url}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open offer
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function OfferStatusBadge({ status }: { status: RegistrarOffer["status"] | "UNKNOWN" }) {
  const tone =
    status === "AVAILABLE"
      ? "border-accent/35 bg-accent/12 text-emerald-900"
      : status === "PREMIUM"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : status === "TAKEN"
          ? "border-slate-200 bg-slate-100 text-slate-700"
          : status === "ERROR"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-cyan-900/10 bg-white text-slate-600";
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone}`}
    >
      {status}
    </span>
  );
}

function offerSummary(offer: RegistrarOffer): string {
  if (offer.price !== null) {
    return formatOfferPrice(offer.price, offer.currency);
  }
  if (offer.status === "AVAILABLE") {
    return "Available; live price unavailable";
  }
  if (offer.status === "TAKEN") {
    return "Already registered";
  }
  if (offer.status === "PREMIUM") {
    return "Premium domain; live price unavailable";
  }
  const detail = offer.detail.trim();
  if (!detail) {
    return "No additional provider detail";
  }
  return detail.length > 140 ? `${detail.slice(0, 137)}...` : detail;
}
