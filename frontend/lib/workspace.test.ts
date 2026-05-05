import { describe, expect, it } from "vitest";

import {
  headerMeta,
  LANGUAGE_OPTIONS,
  primaryNavItems,
  settingsNavItem,
  workspaceHeaderChrome
} from "./workspace";

describe("workspace navigation", () => {
  it("adds a scoring route to the primary workspace menu", () => {
    expect(primaryNavItems.map((item) => item.href)).toContain("/app/scoring");
  });

  it("keeps settings as a secondary menu item", () => {
    expect(settingsNavItem.href).toBe("/app/settings");
  });

  it("uses generator header copy that matches discovery and scoring", () => {
    expect(headerMeta["/app/generator"]).toEqual({
      eyebrow: "Workspace",
      title: "Domain Discovery",
      subtitle: "Generate geo domains, score them, and check live availability."
    });
  });

  it("keeps the shared workspace header compact and professional", () => {
    expect(workspaceHeaderChrome.container).toContain("min-h-[3.75rem]");
    expect(workspaceHeaderChrome.container).not.toContain("min-h-16");
    expect(workspaceHeaderChrome.title).toContain("text-[0.95rem]");
    expect(workspaceHeaderChrome.subtitle).toContain("text-[13px]");
  });

  it("offers compact language switch options in the shell", () => {
    expect(LANGUAGE_OPTIONS.map((item) => item.code)).toEqual(["en", "fr", "ar"]);
  });
});
