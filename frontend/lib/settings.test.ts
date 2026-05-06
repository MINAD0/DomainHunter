import { describe, expect, it } from "vitest";

import { emptySettings } from "./domain";
import {
  hasAnyConfiguredCheckProvider,
  hasAnyConfiguredOfficialSearchProvider,
  hasConfiguredSelectedAiProvider,
  providerApiKeyLabel,
  selectedProviderApiKey
} from "./settings";

describe("settings helpers", () => {
  it("returns the api key for the selected AI provider only", () => {
    const settings = emptySettings();
    settings.ai.provider = "gemini";
    settings.ai.api_keys.openrouter = "sk-openrouter";
    settings.ai.api_keys.gemini = "gemini-key";

    expect(selectedProviderApiKey(settings)).toBe("gemini-key");
  });

  it("labels the dynamic provider api key field", () => {
    expect(providerApiKeyLabel("openrouter")).toBe("OpenRouter API key");
    expect(providerApiKeyLabel("custom-provider")).toBe("Custom Provider API key");
  });

  it("detects when the selected AI provider is configured", () => {
    const settings = emptySettings();
    expect(hasConfiguredSelectedAiProvider(settings)).toBe(false);

    settings.ai.api_keys.openrouter = "sk-openrouter";
    expect(hasConfiguredSelectedAiProvider(settings)).toBe(true);
  });

  it("detects when any domain check provider is configured", () => {
    const settings = emptySettings();
    expect(hasAnyConfiguredCheckProvider(settings)).toBe(false);

    settings.domain_providers.whoisxml.api_key = "whois-key";
    expect(hasAnyConfiguredCheckProvider(settings)).toBe(true);
  });

  it("detects when any official search pricing provider is configured", () => {
    const settings = emptySettings();
    expect(hasAnyConfiguredOfficialSearchProvider(settings)).toBe(false);

    settings.domain_providers.godaddy.api_key = "godaddy-key";
    settings.domain_providers.godaddy.api_secret = "godaddy-secret";
    expect(hasAnyConfiguredOfficialSearchProvider(settings)).toBe(true);
  });
});
