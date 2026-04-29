import { describe, expect, it } from "vitest";

import { emptySettings } from "./domain";
import { providerApiKeyLabel, selectedProviderApiKey } from "./settings";

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
});
