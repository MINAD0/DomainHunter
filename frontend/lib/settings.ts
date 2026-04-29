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
