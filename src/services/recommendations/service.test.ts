import { describe, expect, it } from "vitest";
import { getRecommendations, RecommendationOptions } from "./service";

describe("recommendations service", () => {
  it("recommends alternative parts within budget constraints", () => {
    const options: RecommendationOptions = {
      strategy: "best-value",
      targetSlot: "cpu",
      currentBuild: {
        storage: [],
      },
      budgetCapCents: 45000, // $450
    };
    
    const results = getRecommendations(options);
    expect(results.length).toBeGreaterThan(0);
    // Highest score should be less than 45000 cents
    expect(results[0].part.priceCents).toBeLessThanOrEqual(45000);
  });
  
  it("avoids recommending incompatible parts", () => {
    // E.g., if motherboard is AM5, it should not recommend an Intel CPU
    const currentBuild = {
      storage: [],
      motherboard: {
        slug: "asus-rog-strix-b650-a",
        category: "MOTHERBOARD" as const,
        categoryPath: "motherboard" as const,
        brand: "ASUS",
        name: "ROG Strix B650-A Gaming WiFi",
        description: "",
        priceCents: 22000,
        specs: { socket: "AM5", formFactor: "ATX", memoryType: "DDR5" },
        highlights: []
      }
    };
    
    const options: RecommendationOptions = {
      strategy: "best-value",
      targetSlot: "cpu",
      currentBuild,
    };
    
    const results = getRecommendations(options);
    expect(results.length).toBeGreaterThan(0);
    
    // All recommended CPUs should be AM5
    results.forEach(res => {
      expect(res.part.specs.socket).toBe("AM5");
    });
  });
});
