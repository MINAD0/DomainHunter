"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { apiText } from "@/lib/api";
import { PageTitle, Panel, StatusMessage, buttonClass } from "@/components/ui";

export default function LogsPage() {
  const [logs, setLogs] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setLogs(await apiText("/logs"));
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
        eyebrow="Logs"
        title="Run history"
        actions={
          <button
            type="button"
            className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-100`}
            onClick={load}
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        }
      />
      {error ? <StatusMessage type="error">{error}</StatusMessage> : null}
      <Panel className="p-4">
        <pre className="min-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          {logs || "No logs yet."}
        </pre>
      </Panel>
    </>
  );
}

