import { describe, expect, it } from "vitest";

import {
  ctaLinks,
  guideSections,
  homepageHighlights,
  homepageSections,
  marketingNav,
  quickStartCommands
} from "./site-content";

describe("marketing site content", () => {
  it("defines the primary marketing navigation", () => {
    expect(marketingNav).toEqual([
      { href: "/", label: "Overview" },
      { href: "/how-to-use", label: "How to Use" },
      { href: "/app", label: "Workspace" }
    ]);
  });

  it("keeps the homepage promise focused on outcomes", () => {
    expect(homepageHighlights).toHaveLength(3);
    expect(homepageHighlights.map((item) => item.title)).toEqual([
      "Move before the market notices",
      "Shortlist names worth your time",
      "Keep the hunt focused on upside"
    ]);
  });

  it("anchors the primary CTA to the homepage get-started section", () => {
    expect(ctaLinks.primary.href).toBe("#get-started");
  });

  it("keeps the premium homepage section order stable", () => {
    expect(homepageSections.map((section) => section.id)).toEqual([
      "timing",
      "workflow-edge",
      "solo-hunter",
      "get-started"
    ]);
  });

  it("includes complete-guide commands for install and first run", () => {
    expect(quickStartCommands.install.command).toContain("pip install -r requirements.txt");
    expect(quickStartCommands.firstRun.command).toBe("python domain_hunter.py");
  });

  it("publishes all guide anchors in reading order", () => {
    expect(guideSections.map((section) => section.id)).toEqual([
      "orientation",
      "install",
      "first-run",
      "cli-usage",
      "ai-generation",
      "providers",
      "useful-options",
      "output",
      "workflow"
    ]);
  });
});
