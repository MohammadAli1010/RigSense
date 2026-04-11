import { describe, expect, it } from "vitest";

import { parts } from "@/data/mock-data";
import { analyzeBuild } from "@/lib/compatibility";

function getPart(slug: string) {
  const part = parts.find((item) => item.slug === slug);

  if (!part) {
    throw new Error(`Missing mock part: ${slug}`);
  }

  return part;
}

describe("analyzeBuild", () => {
  it("marks a fully compatible build as ready", () => {
    const result = analyzeBuild({
      cpu: getPart("amd-ryzen-7-9800x3d"),
      motherboard: getPart("asus-rog-strix-b850-a"),
      gpu: getPart("nvidia-rtx-5070-ti-founders"),
      ram: getPart("gskill-trident-z5-32gb-6000"),
      storage: [getPart("samsung-990-pro-2tb")],
      psu: getPart("corsair-rm850x-shift"),
      pcCase: getPart("lian-li-lancool-216"),
      cooler: getPart("deepcool-assassin-iv"),
    });

    expect(result.compatibilityStatus).toBe("OK");
    expect(result.readiness).toBe("ready");
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.requiredSlotsMissing).toEqual([]);
    expect(result.estimatedWattage).toBe(505);
    expect(result.totalPriceCents).toBe(217290);
  });

  it("keeps incomplete builds in draft state and lists missing required slots", () => {
    const result = analyzeBuild({
      cpu: getPart("amd-ryzen-7-9800x3d"),
      motherboard: undefined,
      gpu: undefined,
      ram: undefined,
      storage: [],
      psu: undefined,
      pcCase: undefined,
      cooler: undefined,
    });

    expect(result.readiness).toBe("draft");
    expect(result.compatibilityStatus).toBe("WARNING");
    expect(result.requiredSlotsMissing).toEqual([
      "Motherboard",
      "RAM",
      "Storage",
      "PSU",
      "Case",
    ]);
    expect(result.warnings).toContain(
      "No CPU cooler selected yet. Add one before treating the build as final.",
    );
    expect(result.warnings).toContain(
      "No dedicated GPU selected. That can still be valid, but gaming and benchmark expectations will differ.",
    );
  });

  it("blocks incompatible part combinations", () => {
    const result = analyzeBuild({
      cpu: getPart("intel-core-ultra-7-265k"),
      motherboard: getPart("asus-rog-strix-b850-a"),
      gpu: {
        ...getPart("nvidia-rtx-5070-ti-founders"),
        specs: {
          ...getPart("nvidia-rtx-5070-ti-founders").specs,
          lengthMm: 450,
        },
      },
      ram: {
        ...getPart("gskill-trident-z5-32gb-6000"),
        specs: {
          ...getPart("gskill-trident-z5-32gb-6000").specs,
          type: "DDR4",
        },
      },
      storage: [getPart("samsung-990-pro-2tb")],
      psu: getPart("corsair-rm850x-shift"),
      pcCase: {
        ...getPart("lian-li-lancool-216"),
        specs: {
          ...getPart("lian-li-lancool-216").specs,
          maxCoolerHeightMm: 150,
          maxGpuLengthMm: 280,
        },
      },
      cooler: {
        ...getPart("deepcool-assassin-iv"),
        specs: {
          ...getPart("deepcool-assassin-iv").specs,
          supportedSockets: ["AM5"],
        },
      },
    });

    expect(result.readiness).toBe("blocked");
    expect(result.compatibilityStatus).toBe("ERROR");
    expect(result.errors).toContain(
      "CPU socket LGA1851 does not match motherboard socket AM5.",
    );
    expect(result.errors).toContain(
      "RAM type DDR4 does not match motherboard memory support DDR5.",
    );
    expect(result.errors).toContain(
      "Selected cooler does not list support for the CPU socket LGA1851.",
    );
    expect(result.errors).toContain("GPU length 450mm exceeds case clearance of 280mm.");
    expect(result.errors).toContain(
      "Cooler height 164mm exceeds case CPU cooler clearance of 150mm.",
    );
  });
});
