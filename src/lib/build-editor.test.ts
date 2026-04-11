import { BuildSlot } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  buildPartsToSelections,
  getBuildSelectionSlugs,
  parseBuildSelections,
} from "@/lib/build-editor";

describe("build-editor helpers", () => {
  it("parses partial builder payloads and fills defaults", () => {
    const result = parseBuildSelections(
      JSON.stringify({
        cpu: "cpu-a",
        primaryStorage: "storage-a",
      }),
    );

    expect(result).toEqual({
      cpu: "cpu-a",
      motherboard: "",
      gpu: "",
      ram: "",
      primaryStorage: "storage-a",
      secondaryStorage: "",
      psu: "",
      pcCase: "",
      cooler: "",
    });
  });

  it("returns null for invalid selection payloads", () => {
    expect(parseBuildSelections("not-json")).toBeNull();
    expect(parseBuildSelections(null)).toBeNull();
  });

  it("preserves ordered slugs and keeps duplicate storage selections", () => {
    const slugs = getBuildSelectionSlugs({
      cpu: "cpu-a",
      motherboard: "mobo-a",
      gpu: "",
      ram: "ram-a",
      primaryStorage: "ssd-a",
      secondaryStorage: "ssd-a",
      psu: "psu-a",
      pcCase: "case-a",
      cooler: "cooler-a",
    });

    expect(slugs).toEqual([
      "cpu-a",
      "mobo-a",
      "ram-a",
      "ssd-a",
      "ssd-a",
      "psu-a",
      "case-a",
      "cooler-a",
    ]);
  });

  it("maps persisted build parts back into builder selections", () => {
    const selections = buildPartsToSelections([
      { slot: BuildSlot.CPU, part: { slug: "cpu-a" } },
      { slot: BuildSlot.MOTHERBOARD, part: { slug: "mobo-a" } },
      { slot: BuildSlot.STORAGE, part: { slug: "ssd-a" } },
      { slot: BuildSlot.STORAGE, part: { slug: "ssd-b" } },
      { slot: BuildSlot.CASE, part: { slug: "case-a" } },
    ]);

    expect(selections).toEqual({
      cpu: "cpu-a",
      motherboard: "mobo-a",
      gpu: "",
      ram: "",
      primaryStorage: "ssd-a",
      secondaryStorage: "ssd-b",
      psu: "",
      pcCase: "case-a",
      cooler: "",
    });
  });
});
