import { describe, expect, it } from "vitest";

import { buildRegistrarUrl, emptySettings, parseTlds, validateGeneratorForm } from "./domain";

describe("domain UI helpers", () => {
  it("normalizes comma and space separated TLDs", () => {
    expect(parseTlds("com, .net io com")).toEqual([".com", ".net", ".io"]);
  });

  it("validates generator form requirements", () => {
    expect(
      validateGeneratorForm({
        country: "United States",
        cities: ["Dallas"],
        niche: "Industrial Cleaning",
        tlds: [".com"],
        count: 25
      })
    ).toBeNull();

    expect(
      validateGeneratorForm({
        country: "",
        cities: [],
        niche: "",
        tlds: [],
        count: 0
      })
    ).toBe("Choose a country.");
  });

  it("builds registrar URLs from settings", () => {
    const settings = emptySettings();
    settings.registrar_base_url = "https://registrar.example/?q=";

    expect(buildRegistrarUrl(settings, "dallascleaning.com")).toBe(
      "https://registrar.example/?q=dallascleaning.com"
    );
  });
});

