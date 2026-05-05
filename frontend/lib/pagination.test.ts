import { describe, expect, it } from "vitest";

import { paginateItems } from "./pagination";

describe("pagination helpers", () => {
  it("returns the requested page slice and total page count", () => {
    const items = Array.from({ length: 17 }, (_value, index) => index + 1);

    expect(paginateItems(items, 2, 8)).toEqual({
      currentPage: 2,
      pageItems: [9, 10, 11, 12, 13, 14, 15, 16],
      totalPages: 3
    });
  });

  it("clamps page numbers into the valid range", () => {
    const items = Array.from({ length: 3 }, (_value, index) => index + 1);

    expect(paginateItems(items, 5, 2)).toEqual({
      currentPage: 2,
      pageItems: [3],
      totalPages: 2
    });
  });
});
