import { describe, expect, it } from "vitest";

import {
  allItemsSelected,
  buildRegistrarUrl,
  buildTldOptions,
  emptySettings,
  parseTlds,
  toggleAllItems,
  validateGeneratorForm
} from "./domain";

describe("domain UI helpers", () => {
  it("normalizes comma and space separated TLDs", () => {
    expect(parseTlds("com, .net io com")).toEqual([".com", ".net", ".io"]);
  });

  it("merges common TLD options with configured defaults", () => {
    expect(buildTldOptions([".biz", ".com"])).toEqual([
      ".com",
      ".net",
      ".org",
      ".io",
      ".co",
      ".ai",
      ".us",
      ".biz"
    ]);
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

  it("detects when all selectable values are chosen", () => {
    expect(allItemsSelected(["Dallas", "Austin"], ["Dallas", "Austin"])).toBe(true);
    expect(allItemsSelected(["Dallas", "Austin"], ["Dallas"])).toBe(false);
  });

  it("toggles full selection sets for grouped inputs", () => {
    expect(toggleAllItems(["Dallas", "Austin"], ["Dallas"])).toEqual(["Dallas", "Austin"]);
    expect(toggleAllItems(["Dallas", "Austin"], ["Dallas", "Austin"])).toEqual([]);
  });
});
