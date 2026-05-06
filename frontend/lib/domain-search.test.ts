import { describe, expect, it } from "vitest";

import { normalizeSearchDomainInput, parseBulkDomainInput } from "./domain-search";

describe("domain search helpers", () => {
  it("normalizes a single domain by trimming protocol and www", () => {
    expect(normalizeSearchDomainInput(" https://www.ExampleDomain.com/path ")).toBe(
      "exampledomain.com"
    );
  });

  it("parses bulk input into unique domain values", () => {
    expect(
      parseBulkDomainInput(`
        exampledomain.com
        https://www.second-domain.net/path
        exampledomain.com, third.org
      `)
    ).toEqual(["exampledomain.com", "second-domain.net", "third.org"]);
  });
});
