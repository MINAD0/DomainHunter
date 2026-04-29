"use client";

import { Save } from "lucide-react";
import { useEffect, useState } from "react";

import type { SettingsPayload } from "@/lib/api";
import { apiGet, apiPost } from "@/lib/api";
import { emptySettings, parseTlds } from "@/lib/domain";
import { Field, PageTitle, Panel, StatusMessage, buttonClass, inputClass } from "@/components/ui";

const aiProviders = ["openrouter", "openai", "gemini", "claude", "custom"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsPayload>(emptySettings());
  const [tlds, setTlds] = useState(".com");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<SettingsPayload>("/settings")
      .then((data) => {
        setSettings(data);
        setTlds(data.default_tlds.join(", "));
      })
      .catch((err) => setError(String(err)));
  }, []);

  function update(path: string[], value: string | number) {
    setSettings((current) => {
      const copy = structuredClone(current);
      let target: Record<string, unknown> = copy as unknown as Record<string, unknown>;
      for (const key of path.slice(0, -1)) {
        target = target[key] as Record<string, unknown>;
      }
      target[path[path.length - 1]] = value;
      return copy;
    });
  }

  async function save() {
    setError("");
    setMessage("");
    try {
      const payload = { ...settings, default_tlds: parseTlds(tlds) };
      const saved = await apiPost<SettingsPayload>("/settings", payload);
      setSettings(saved);
      setTlds(saved.default_tlds.join(", "));
      setMessage("Settings saved.");
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="Settings"
        title="Local provider configuration"
        actions={
          <button className={`${buttonClass} bg-blue text-carbon shadow-glow hover:bg-sky-300`} type="button" onClick={save}>
            <Save className="h-4 w-4" aria-hidden="true" />
            Save settings
          </button>
        }
      />
      <div className="space-y-3">
        {message ? <StatusMessage type="success">{message}</StatusMessage> : null}
        {error ? <StatusMessage type="error">{error}</StatusMessage> : null}
      </div>

      <div className="mt-4 grid gap-6 xl:grid-cols-2">
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-navy">AI config</h2>
          <div className="grid gap-4">
            <Field label="Provider">
              <select className={inputClass} value={settings.ai.provider} onChange={(event) => update(["ai", "provider"], event.target.value)}>
                {aiProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Model">
              <input className={inputClass} value={settings.ai.model} onChange={(event) => update(["ai", "model"], event.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              {aiProviders.map((provider) => (
                <Field key={provider} label={`${provider} key`}>
                  <input
                    className={inputClass}
                    value={settings.ai.api_keys[provider] ?? ""}
                    onChange={(event) => update(["ai", "api_keys", provider], event.target.value)}
                  />
                </Field>
              ))}
            </div>
            <Field label="Custom endpoint">
              <input
                className={inputClass}
                value={settings.ai.custom_endpoint}
                onChange={(event) => update(["ai", "custom_endpoint"], event.target.value)}
              />
            </Field>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-navy">Run defaults</h2>
          <div className="grid gap-4">
            <Field label="Default TLDs">
              <input className={inputClass} value={tlds} onChange={(event) => setTlds(event.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Max checks per run">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={1000}
                  value={settings.max_checks_per_run}
                  onChange={(event) => update(["max_checks_per_run"], Number(event.target.value))}
                />
              </Field>
              <Field label="Delay between checks">
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step={0.1}
                  value={settings.delay_between_checks}
                  onChange={(event) => update(["delay_between_checks"], Number(event.target.value))}
                />
              </Field>
            </div>
            <Field label="Registrar URL prefix">
              <input
                className={inputClass}
                value={settings.registrar_base_url}
                onChange={(event) => update(["registrar_base_url"], event.target.value)}
              />
            </Field>
          </div>
        </Panel>

        <Panel className="p-5 xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-navy">Domain check provider keys</h2>
          <div className="grid gap-4 lg:grid-cols-4">
            <Field label="Namecheap API user">
              <input className={inputClass} value={settings.domain_providers.namecheap?.api_user ?? ""} onChange={(event) => update(["domain_providers", "namecheap", "api_user"], event.target.value)} />
            </Field>
            <Field label="Namecheap API key">
              <input className={inputClass} value={settings.domain_providers.namecheap?.api_key ?? ""} onChange={(event) => update(["domain_providers", "namecheap", "api_key"], event.target.value)} />
            </Field>
            <Field label="Namecheap username">
              <input className={inputClass} value={settings.domain_providers.namecheap?.username ?? ""} onChange={(event) => update(["domain_providers", "namecheap", "username"], event.target.value)} />
            </Field>
            <Field label="Namecheap client IP">
              <input className={inputClass} value={settings.domain_providers.namecheap?.client_ip ?? ""} onChange={(event) => update(["domain_providers", "namecheap", "client_ip"], event.target.value)} />
            </Field>
            <Field label="WhoisXML API key">
              <input className={inputClass} value={settings.domain_providers.whoisxml?.api_key ?? ""} onChange={(event) => update(["domain_providers", "whoisxml", "api_key"], event.target.value)} />
            </Field>
            <Field label="GoDaddy API key">
              <input className={inputClass} value={settings.domain_providers.godaddy?.api_key ?? ""} onChange={(event) => update(["domain_providers", "godaddy", "api_key"], event.target.value)} />
            </Field>
            <Field label="GoDaddy API secret">
              <input className={inputClass} value={settings.domain_providers.godaddy?.api_secret ?? ""} onChange={(event) => update(["domain_providers", "godaddy", "api_secret"], event.target.value)} />
            </Field>
            <Field label="RapidAPI key">
              <input className={inputClass} value={settings.domain_providers.rapidapi?.api_key ?? ""} onChange={(event) => update(["domain_providers", "rapidapi", "api_key"], event.target.value)} />
            </Field>
            <Field label="RapidAPI host">
              <input className={inputClass} value={settings.domain_providers.rapidapi?.host ?? ""} onChange={(event) => update(["domain_providers", "rapidapi", "host"], event.target.value)} />
            </Field>
            <Field label="RapidAPI URL">
              <input className={inputClass} value={settings.domain_providers.rapidapi?.url ?? ""} onChange={(event) => update(["domain_providers", "rapidapi", "url"], event.target.value)} />
            </Field>
            <Field label="RapidAPI domain param">
              <input className={inputClass} value={settings.domain_providers.rapidapi?.domain_param ?? "domain"} onChange={(event) => update(["domain_providers", "rapidapi", "domain_param"], event.target.value)} />
            </Field>
          </div>
        </Panel>
      </div>
    </>
  );
}
