import { describe, expect, it, vi } from "vitest";

import {
  copyDomainToClipboard,
  copyDomainWithFallback,
  saveDomainMessage
} from "./domain-actions";

describe("domain actions", () => {
  it("copies a domain through the provided clipboard adapter", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(copyDomainToClipboard({ writeText }, "dallascleaning.com")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("dallascleaning.com");
  });

  it("returns false when clipboard support is missing", async () => {
    await expect(copyDomainToClipboard(undefined, "dallascleaning.com")).resolves.toBe(false);
  });

  it("falls back when direct clipboard copy is unavailable", async () => {
    const fallback = vi.fn().mockReturnValue(true);

    await expect(
      copyDomainWithFallback({
        clipboard: undefined,
        domain: "dallascleaning.com",
        fallback
      })
    ).resolves.toBe(true);

    expect(fallback).toHaveBeenCalledWith("dallascleaning.com");
  });

  it("falls back when clipboard write fails", async () => {
    const fallback = vi.fn().mockReturnValue(true);
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));

    await expect(
      copyDomainWithFallback({
        clipboard: { writeText },
        domain: "dallascleaning.com",
        fallback
      })
    ).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledWith("dallascleaning.com");
    expect(fallback).toHaveBeenCalledWith("dallascleaning.com");
  });

  it("builds a visible success message for saves", () => {
    expect(saveDomainMessage("dallascleaning.com")).toBe("Saved dallascleaning.com.");
  });
});
