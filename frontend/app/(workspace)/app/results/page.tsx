"use client";

import { Download, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

import type { DomainResult, SettingsPayload } from "@/lib/api";
import { apiGet, exportUrl } from "@/lib/api";
import { DomainTable } from "@/components/domain-table";
import { PageTitle, Panel, StatusMessage, buttonClass } from "@/components/ui";

export default function ResultsPage() {
  const [results, setResults] = useState<DomainResult[]>([]);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [resultData, settingsData] = await Promise.all([
        apiGet<{ domains: DomainResult[] }>("/results"),
        apiGet<SettingsPayload>("/settings")
      ]);
      setResults(resultData.domains);
      setSettings(settingsData);
      setError("");
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <PageTitle
        eyebrow="Results"
        title="Available domains"
        actions={
          <>
            <button
              type="button"
              className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-100`}
              onClick={load}
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
            <a className={`${buttonClass} bg-blue text-carbon shadow-glow hover:bg-sky-300`} href={exportUrl("csv")}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </a>
            <a className={`${buttonClass} bg-navy text-white hover:bg-graphite`} href={exportUrl("txt")}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export TXT
            </a>
          </>
        }
      />
      {error ? <StatusMessage type="error">{error}</StatusMessage> : null}
      <Panel>
        <DomainTable domains={results} settings={settings} onSaved={load} />
      </Panel>
    </>
  );
}
