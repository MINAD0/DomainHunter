export function normalizeSearchDomainInput(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }
  const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    const host = (parsed.hostname || "").replace(/^www\./, "");
    return host.trim().toLowerCase();
  } catch {
    return trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].trim();
  }
}

export function parseBulkDomainInput(value: string): string[] {
  const seen = new Set<string>();
  const domains: string[] = [];
  for (const item of value.split(/[\s,;]+/)) {
    const normalized = normalizeSearchDomainInput(item);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    domains.push(normalized);
  }
  return domains;
}

export function formatOfferPrice(price: number | null, currency: string | null): string {
  if (price === null) {
    return "Live price unavailable";
  }
  return `${currency ?? "USD"} ${price.toFixed(2)}`;
}
