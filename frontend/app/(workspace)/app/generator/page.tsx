"use client";

import Link from "next/link";
import { ChevronDown, Play, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { DomainResult, GeoStyle, SettingsPayload } from "@/lib/api";
import { apiGet, apiPost } from "@/lib/api";
import { MOST_SEARCHED_NICHES } from "@/lib/niches";
import {
  allItemsSelected,
  buildTldOptions,
  GEO_STYLES,
  emptySettings,
  toggleAllItems,
  validateGeneratorForm
} from "@/lib/domain";
import {
  hasAnyConfiguredCheckProvider,
  hasConfiguredSelectedAiProvider
} from "@/lib/settings";
import { DomainTable } from "@/components/domain-table";
import { Field, PageTitle, Panel, StatusMessage, buttonClass, inputClass } from "@/components/ui";

export default function GeneratorPage() {
  const [countries, setCountries] = useState<string[]>(["United States"]);
  const [cities, setCities] = useState<string[]>(["Dallas"]);
  const [country, setCountry] = useState("United States");
  const [selectedCities, setSelectedCities] = useState<string[]>(["Dallas"]);
  const [niche, setNiche] = useState("Industrial Cleaning");
  const [niches, setNiches] = useState<string[]>(MOST_SEARCHED_NICHES);
  const [customNicheEnabled, setCustomNicheEnabled] = useState(false);
  const [selectedTlds, setSelectedTlds] = useState<string[]>([".com"]);
  const [count, setCount] = useState(25);
  const [style, setStyle] = useState<GeoStyle>("Premium Geo");
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<{ countries: string[] }>("/countries")
      .then((data) => setCountries(data.countries))
      .catch((err) => setError(String(err)));
    apiGet<SettingsPayload>("/settings")
      .then((data) => {
        setSettings(data);
        setSelectedTlds(data.default_tlds.length ? data.default_tlds : [".com"]);
      })
      .catch(() => setSettings(emptySettings()));
  }, []);

  useEffect(() => {
    apiGet<{ cities: string[] }>(`/cities?country=${encodeURIComponent(country)}`)
      .then((data) => {
        setCities(data.cities);
        setSelectedCities((current) => current.filter((city) => data.cities.includes(city)));
      })
      .catch((err) => setError(String(err)));
  }, [country]);

  useEffect(() => {
    apiGet<{ niches: string[] }>("/niches")
      .then((data) => {
        if (Array.isArray(data.niches) && data.niches.length) {
          setNiches(data.niches);
          if (!data.niches.includes(niche)) {
            setCustomNicheEnabled(true);
          }
        }
      })
      .catch(() => setNiches(MOST_SEARCHED_NICHES));
  }, []);

  const tldOptions = useMemo(
    () => buildTldOptions(settings?.default_tlds ?? emptySettings().default_tlds),
    [settings]
  );
  const allCitiesSelected = useMemo(
    () => allItemsSelected(cities, selectedCities),
    [cities, selectedCities]
  );
  const aiConfigured = useMemo(
    () => (settings ? hasConfiguredSelectedAiProvider(settings) : false),
    [settings]
  );
  const checkProviderConfigured = useMemo(
    () => (settings ? hasAnyConfiguredCheckProvider(settings) : false),
    [settings]
  );

  function toggleCity(city: string) {
    setSelectedCities((current) =>
      current.includes(city) ? current.filter((item) => item !== city) : [...current, city]
    );
  }

  function toggleTld(tld: string) {
    setSelectedTlds((current) =>
      current.includes(tld) ? current.filter((item) => item !== tld) : [...current, tld]
    );
  }

  async function runScan() {
    const validation = validateGeneratorForm({
      country,
      cities: selectedCities,
      niche,
      tlds: selectedTlds,
      count
    });
    if (validation) {
      setError(validation);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await apiPost<{ domains: DomainResult[] }>("/generate-and-check", {
        country,
        cities: selectedCities,
        niche,
        tlds: selectedTlds,
        count,
        style
      });
      setResults(response.domains);
      setMessage(`${response.domains.length} available domains found.`);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageTitle eyebrow="Domain Discovery" title="Discover, score, and check GeoDomains" />

      {settings ? (
        <div className="mb-4 space-y-3">
          {!aiConfigured ? (
            <StatusMessage type="error">
              AI provider is not configured yet. Keyword expansion works best after adding your AI key in{" "}
              <Link className="font-semibold underline" href="/app/settings">
                Settings
              </Link>
              .
            </StatusMessage>
          ) : null}
          {!checkProviderConfigured ? (
            <StatusMessage type="error">
              No domain check provider is configured yet. Availability checks will fall back to RDAP/WHOIS until you add a provider in{" "}
              <Link className="font-semibold underline" href="/app/settings">
                Settings
              </Link>
              .
            </StatusMessage>
          ) : null}
        </div>
      ) : null}

      <div className="grid max-w-full min-w-0 items-start gap-6 xl:grid-cols-[26rem_minmax(0,_1fr)] 2xl:grid-cols-[28rem_minmax(0,_1fr)]">
        <Panel className="w-full overflow-hidden p-4 sm:p-5">
          <div className="grid min-w-0 gap-4">
            <Field label="Country">
              <select className={inputClass} value={country} onChange={(event) => setCountry(event.target.value)}>
                {countries.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="block text-[13px] font-semibold text-slate-700 sm:text-sm">Cities</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="focus-ring inline-flex min-h-8 items-center rounded-md border border-cyan-900/10 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
                    onClick={() => setSelectedCities(toggleAllItems(cities, selectedCities))}
                  >
                    {allCitiesSelected ? "Clear all" : "Select all"}
                  </button>
                </div>
              </div>
              <div className="max-h-72 max-w-full overflow-auto rounded-md border border-slate-300 bg-white p-2">
                <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
                  {cities.map((city) => (
                    <label key={city} className="flex min-h-10 items-center gap-2 rounded px-2 text-[15px] hover:bg-slate-50 sm:text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue"
                        checked={selectedCities.includes(city)}
                        onChange={() => toggleCity(city)}
                      />
                      <span>{city}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Field label="Niche">
              <div>
                <select
                  className={inputClass}
                  value={customNicheEnabled ? "Other" : niche}
                  onChange={(event) => {
                    const val = event.target.value;
                    if (val === "Other") {
                      setCustomNicheEnabled(true);
                      setNiche("");
                    } else {
                      setCustomNicheEnabled(false);
                      setNiche(val);
                    }
                  }}
                >
                  {niches.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                  <option value="Other">Other (custom)</option>
                </select>
                {customNicheEnabled ? (
                  <input
                    className={`${inputClass} mt-2`}
                    value={niche}
                    onChange={(event) => setNiche(event.target.value)}
                    placeholder="Enter custom niche"
                  />
                ) : null}
              </div>
            </Field>

            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700 sm:text-sm">TLDs</span>
              <details open className="rounded-md border border-cyan-900/15 bg-slate-50/70">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-[13px] font-semibold text-slate-700">
                  <span>{selectedTlds.length} selected</span>
                  <ChevronDown className="h-4 w-4 text-slate-500 transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="grid gap-2 border-t border-cyan-900/10 p-3 sm:grid-cols-2">
                  {tldOptions.map((tld) => {
                    const checked = selectedTlds.includes(tld);
                    return (
                      <label
                        key={tld}
                        className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 text-[15px] font-medium transition sm:text-sm ${
                          checked
                            ? "border-blue/50 bg-blue/12 text-navy shadow-sm"
                            : "border-cyan-900/15 bg-white text-slate-700 hover:border-blue/35 hover:bg-sky-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue"
                          checked={checked}
                          onChange={() => toggleTld(tld)}
                        />
                        <span>{tld}</span>
                      </label>
                    );
                  })}
                </div>
              </details>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Number of domains">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                />
              </Field>

              <Field label="Style">
                <select className={inputClass} value={style} onChange={(event) => setStyle(event.target.value as GeoStyle)}>
                  {GEO_STYLES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>

            <button
              type="button"
              className={`${buttonClass} bg-blue text-carbon shadow-glow hover:bg-sky-300`}
              onClick={runScan}
              disabled={loading}
            >
              {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Generate & Check
            </button>
          </div>
        </Panel>

        <div className="min-w-0 space-y-4">
          {loading ? <StatusMessage type="loading">Checking availability...</StatusMessage> : null}
          {message ? <StatusMessage type="success">{message}</StatusMessage> : null}
          {error ? <StatusMessage type="error">{error}</StatusMessage> : null}
          <Panel className="overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold text-navy sm:text-lg">Available results</h2>
            </div>
            <DomainTable domains={results} settings={settings} />
          </Panel>
        </div>
      </div>
    </>
  );
}
