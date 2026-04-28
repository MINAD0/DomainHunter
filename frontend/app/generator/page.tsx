"use client";

import { Play, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { DomainResult, GeoStyle, SettingsPayload } from "@/lib/api";
import { apiGet, apiPost } from "@/lib/api";
import { GEO_STYLES, emptySettings, parseTlds, validateGeneratorForm } from "@/lib/domain";
import { DomainTable } from "@/components/domain-table";
import { Field, PageTitle, Panel, StatusMessage, buttonClass, inputClass } from "@/components/ui";

export default function GeneratorPage() {
  const [countries, setCountries] = useState<string[]>(["United States"]);
  const [cities, setCities] = useState<string[]>(["Dallas"]);
  const [country, setCountry] = useState("United States");
  const [selectedCities, setSelectedCities] = useState<string[]>(["Dallas"]);
  const [niche, setNiche] = useState("Industrial Cleaning");
  const [tlds, setTlds] = useState(".com");
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
        setTlds(data.default_tlds.join(", "));
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

  const normalizedTlds = useMemo(() => parseTlds(tlds), [tlds]);

  function toggleCity(city: string) {
    setSelectedCities((current) =>
      current.includes(city) ? current.filter((item) => item !== city) : [...current, city]
    );
  }

  async function runScan() {
    const validation = validateGeneratorForm({
      country,
      cities: selectedCities,
      niche,
      tlds: normalizedTlds,
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
        tlds: normalizedTlds,
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
      <PageTitle eyebrow="Geo Generator" title="Generate and check available GeoDomains" />

      <div className="grid max-w-full min-w-0 gap-6 xl:grid-cols-[420px_1fr]">
        <Panel className="w-full overflow-hidden p-5">
          <div className="grid min-w-0 gap-4">
            <Field label="Country">
              <select className={inputClass} value={country} onChange={(event) => setCountry(event.target.value)}>
                {countries.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>

            <div>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Cities</span>
              <div className="max-h-56 max-w-full overflow-auto rounded-md border border-slate-300 bg-white p-2">
                <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
                  {cities.map((city) => (
                    <label key={city} className="flex min-h-10 items-center gap-2 rounded px-2 text-sm hover:bg-slate-50">
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
              <input className={inputClass} value={niche} onChange={(event) => setNiche(event.target.value)} />
            </Field>

            <Field label="TLDs">
              <input className={inputClass} value={tlds} onChange={(event) => setTlds(event.target.value)} />
            </Field>

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
              className={`${buttonClass} bg-accent text-white hover:bg-emerald-700`}
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
          <Panel>
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="font-semibold text-navy">Available results</h2>
            </div>
            <DomainTable domains={results} settings={settings} />
          </Panel>
        </div>
      </div>
    </>
  );
}
