"use client";

import { Download, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { SavedDomain } from "@/lib/api";
import { apiDelete, apiGet, apiPost, exportUrl } from "@/lib/api";
import { AvailableBadge, PageTitle, Panel, StatusMessage, buttonClass, inputClass } from "@/components/ui";

export default function SavedPage() {
  const [domains, setDomains] = useState<SavedDomain[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const data = await apiGet<SavedDomain[]>("/saved");
      setDomains(data);
      setNotes(Object.fromEntries(data.map((item) => [item.domain, item.note ?? ""])));
      setError("");
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveNote(item: SavedDomain) {
    await apiPost("/saved", { ...item, note: notes[item.domain] ?? "" });
    setMessage(`Saved note for ${item.domain}.`);
    await load();
  }

  async function remove(domain: string) {
    await apiDelete(`/saved/${encodeURIComponent(domain)}`);
    setMessage(`Removed ${domain}.`);
    await load();
  }

  return (
    <>
      <PageTitle
        eyebrow="Saved Domains"
        title="Saved resale targets"
        actions={
          <>
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
      <div className="space-y-3">
        {message ? <StatusMessage type="success">{message}</StatusMessage> : null}
        {error ? <StatusMessage type="error">{error}</StatusMessage> : null}
      </div>
      <Panel className="mt-4">
        <div className="divide-y divide-slate-200">
          {domains.length ? (
            domains.map((item) => (
              <div key={item.domain} className="grid gap-4 p-4 lg:grid-cols-[1fr_300px_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy">{item.domain}</p>
                    <AvailableBadge />
                    <span className="text-sm font-semibold text-slate-500">Score {item.score}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {`${item.city} - ${item.niche} - saved ${new Date(item.saved_at).toLocaleString()}`}
                  </p>
                </div>
                <input
                  className={inputClass}
                  value={notes[item.domain] ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [item.domain]: event.target.value }))}
                  placeholder="Add note"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`${buttonClass} border border-emerald-200 bg-emerald-50 px-3 text-emerald-800 hover:bg-emerald-100`}
                    title="Save note"
                    aria-label={`Save note for ${item.domain}`}
                    onClick={() => saveNote(item)}
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${buttonClass} border border-red-200 bg-red-50 px-3 text-red-700 hover:bg-red-100`}
                    title="Remove"
                    aria-label={`Remove ${item.domain}`}
                    onClick={() => remove(item.domain)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No saved domains yet.</p>
          )}
        </div>
      </Panel>
    </>
  );
}
