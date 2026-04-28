export type DomainStatus = "AVAILABLE" | "TAKEN" | "PREMIUM" | "UNKNOWN" | "ERROR";

export type GeoStyle = "Exact Match" | "Service Based" | "Lead Generation" | "Premium Geo";

export type DomainCandidate = {
  domain: string;
  city: string;
  niche: string;
  tld: string;
};

export type DomainResult = DomainCandidate & {
  status: DomainStatus;
  score: number;
  source: string;
  checked_at: string;
};

export type SavedDomain = DomainResult & {
  note: string;
  saved_at: string;
};

export type SettingsPayload = {
  ai: {
    provider: string;
    model: string;
    api_keys: Record<string, string>;
    custom_endpoint: string;
  };
  domain_providers: Record<string, Record<string, string>>;
  default_tlds: string[];
  max_checks_per_run: number;
  delay_between_checks: number;
  registrar_base_url: string;
};

export type DashboardStats = {
  total_domains_generated: number;
  available_domains_found: number;
  last_scan: string | null;
  top_saved_domains: SavedDomain[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}

export async function apiText(path: string): Promise<string> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.text();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function exportUrl(format: "csv" | "txt"): string {
  return `${API_BASE}/export?format=${format}`;
}

