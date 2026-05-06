import type { SettingsPayload } from "@/lib/api";

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  claude: "Claude",
  custom: "Custom",
  gemini: "Gemini",
  openai: "OpenAI",
  openrouter: "OpenRouter"
};

export function providerDisplayName(provider: string): string {
  if (PROVIDER_DISPLAY_NAMES[provider]) {
    return PROVIDER_DISPLAY_NAMES[provider];
  }
  return provider
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function providerApiKeyLabel(provider: string): string {
  const display = providerDisplayName(provider);
  return `${display || "Provider"} API key`;
}

export function selectedProviderApiKey(settings: SettingsPayload): string {
  return settings.ai.api_keys[settings.ai.provider] ?? "";
}

export function hasConfiguredSelectedAiProvider(settings: SettingsPayload): boolean {
  return Boolean(selectedProviderApiKey(settings).trim());
}

export function hasAnyConfiguredCheckProvider(settings: SettingsPayload): boolean {
  return Object.values(settings.domain_providers).some((provider) =>
    Object.entries(provider).some(([key, value]) => {
      if (key === "currency" || key === "use_sandbox" || key === "domain_param") {
        return false;
      }
      return Boolean(String(value ?? "").trim());
    })
  );
}

export function hasAnyConfiguredOfficialSearchProvider(settings: SettingsPayload): boolean {
  return [
    hasAll(settings.domain_providers.godaddy, ["api_key", "api_secret"]),
    hasAll(settings.domain_providers.namecheap, ["api_user", "api_key", "username", "client_ip"]),
    hasAll(settings.domain_providers.dynadot, ["api_key"]),
    hasAll(settings.domain_providers.namecom, ["username", "token"]),
    hasAll(settings.domain_providers.spaceship, ["api_key", "api_secret"])
  ].some(Boolean);
}

function hasAll(provider: Record<string, string> | undefined, keys: string[]): boolean {
  if (!provider) {
    return false;
  }
  return keys.every((key) => Boolean(String(provider[key] ?? "").trim()));
}
