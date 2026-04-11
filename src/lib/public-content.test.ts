import { describe, expect, it } from "vitest";

import {
  derivePartHighlights,
  estimateReadTime,
  normalizeSpecs,
} from "@/lib/public-content";

describe("public-content helpers", () => {
  it("keeps only serializable spec values", () => {
    const specs = normalizeSpecs({
      socket: "AM5",
      cores: 8,
      supportedFormFactors: ["ATX", "Micro-ATX"],
      nested: { unsupported: true },
      mixedArray: ["ATX", 42],
      nothing: null,
    });

    expect(specs).toEqual({
      socket: "AM5",
      cores: 8,
      supportedFormFactors: ["ATX", "Micro-ATX"],
    });
  });

  it("derives concise highlights from the first three spec values", () => {
    const highlights = derivePartHighlights({
      socket: "AM5",
      cores: 8,
      supportedSockets: ["AM5", "LGA1851"],
      ignoredLater: "later",
    });

    expect(highlights).toEqual(["AM5", "8", "AM5 / LGA1851"]);
  });

  it("estimates read time with a minimum of one minute and rounds up", () => {
    expect(estimateReadTime("short text")).toBe("1 min read");
    expect(estimateReadTime(Array.from({ length: 221 }, () => "word").join(" "))).toBe(
      "2 min read",
    );
  });
});
