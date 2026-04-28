import type { GeoStyle, SettingsPayload } from "@/lib/api";

export const GEO_STYLES: GeoStyle[] = [
  "Exact Match",
  "Service Based",
  "Lead Generation",
  "Premium Geo"
];

export function parseTlds(value: string): string[] {
  const tlds = value
    .split(/[,\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => (item.startsWith(".") ? item : `.${item}`));
  return Array.from(new Set(tlds));
}

export function validateGeneratorForm(input: {
  country: string;
  cities: string[];
  niche: string;
  tlds: string[];
  count: number;
}): string | null {
  if (!input.country.trim()) return "Choose a country.";
  if (!input.cities.length) return "Choose at least one city.";
  if (!input.niche.trim()) return "Enter a niche.";
  if (!input.tlds.length) return "Add at least one TLD.";
  if (input.count < 1 || input.count > 500) return "Choose between 1 and 500 domains.";
  return null;
}

export function buildRegistrarUrl(settings: SettingsPayload | null, domain: string): string {
  const base =
    settings?.registrar_base_url ||
    "https://www.namecheap.com/domains/registration/results/?domain=";
  return `${base}${encodeURIComponent(domain)}`;
}

export function emptySettings(): SettingsPayload {
  return {
    ai: {
      provider: "openrouter",
      model: "openrouter/free",
      api_keys: {
        openai: "",
        gemini: "",
        claude: "",
        openrouter: "",
        custom: ""
      },
      custom_endpoint: ""
    },
    domain_providers: {
      namecheap: {
        api_user: "",
        api_key: "",
        username: "",
        client_ip: ""
      },
      whoisxml: { api_key: "" },
      godaddy: { api_key: "", api_secret: "" },
      rapidapi: {
        api_key: "",
        host: "",
        url: "",
        domain_param: "domain"
      }
    },
    default_tlds: [".com"],
    max_checks_per_run: 50,
    delay_between_checks: 0.25,
    registrar_base_url: "https://www.namecheap.com/domains/registration/results/?domain="
  };
}

