import { getPartsByCategory, type MockPart, type CategoryPath } from "@/data/mock-data";
import { type BuilderSelectionParts, analyzeBuild } from "@/lib/compatibility";
import { analytics } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export type RecommendationStrategy = "best-value" | "performance-pick" | "balanced" | "upgrade-path" | "cheaper-alternative" | "compatible-replacement";

export interface RecommendationOptions {
  strategy: RecommendationStrategy;
  targetSlot: CategoryPath;
  currentBuild: BuilderSelectionParts;
  budgetCapCents?: number;
  limit?: number;
}

export interface RecommendationScore {
  part: MockPart;
  score: number;
  reasons: string[];
}

function getSlotKey(slot: CategoryPath): keyof BuilderSelectionParts {
  if (slot === "case") return "pcCase";
  if (slot === "storage") return "storage";
  return slot as keyof BuilderSelectionParts;
}

export function scorePart(
  candidate: MockPart,
  currentBuild: BuilderSelectionParts,
  targetSlot: CategoryPath,
  strategy: RecommendationStrategy,
  budgetCapCents?: number
): RecommendationScore {
  let score = 0;
  const reasons: string[] = [];

  const slotKey = getSlotKey(targetSlot);

  // 1. Check compatibility context
  const tempBuild: BuilderSelectionParts = {
    ...currentBuild,
    storage: currentBuild.storage ? [...currentBuild.storage] : [],
  };

  if (slotKey === "storage") {
    // If the candidate isn't already in storage, push it
    if (!tempBuild.storage.find(p => p.slug === candidate.slug)) {
      tempBuild.storage.push(candidate);
    }
  } else {
    // We are replacing a specific slot
    (tempBuild as any)[slotKey] = candidate;
  }

  const analysisBefore = analyzeBuild(currentBuild);
  const analysisAfter = analyzeBuild(tempBuild);

  // Severe penalty if this candidate introduces new errors
  if (analysisAfter.errors.length > analysisBefore.errors.length) {
    score -= 1000;
    reasons.push("Incompatible with current selections.");
    return { part: candidate, score, reasons };
  } else if (analysisAfter.errors.length < analysisBefore.errors.length) {
    // Bonus if it resolves existing errors
    score += 500;
    reasons.push("Resolves existing compatibility issues.");
  }

  // 2. Budget constraint
  if (budgetCapCents && candidate.priceCents > budgetCapCents) {
    score -= 500;
    reasons.push("Exceeds the target budget.");
  }

  // 3. Strategy specific scoring
  const currentSlotPart = slotKey === "storage" ? currentBuild.storage[0] : currentBuild[slotKey] as MockPart | undefined;
  const currentPrice = currentSlotPart?.priceCents || 0;

  switch (strategy) {
    case "cheaper-alternative":
      if (currentSlotPart && candidate.priceCents < currentPrice) {
        score += 100;
        const diff = ((currentPrice - candidate.priceCents) / 100).toFixed(2);
        reasons.push(`Saves $${diff} over current selection.`);
      } else {
        score -= 50;
      }
      break;

    case "upgrade-path":
      if (currentSlotPart && candidate.priceCents > currentPrice) {
        // Assume price correlates roughly with performance in this mock context,
        // but penalize if it's astronomically more expensive (e.g. > 2x)
        if (candidate.priceCents > currentPrice * 2) {
          score -= 50;
          reasons.push("Significant price jump.");
        } else {
          score += 100;
          reasons.push("Higher performance tier.");
        }
      } else {
        score -= 50;
      }
      break;

    case "balanced":
      // Prefers parts that are reasonably priced but high quality.
      // We can use a simple heuristic for mock data: 
      score += 50;
      break;
      
    case "best-value":
      // Lowest price without causing errors
      score += Math.max(0, 100 - (candidate.priceCents / 1000));
      reasons.push("Strong price-to-performance value.");
      break;
      
    case "performance-pick":
      score += (candidate.priceCents / 1000); // More expensive = higher score
      reasons.push("Top-tier performance component.");
      break;
      
    case "compatible-replacement":
      score += 50;
      reasons.push("Confirmed compatible with your build.");
      break;
  }

  return { part: candidate, score, reasons };
}

export function getRecommendations(options: RecommendationOptions): RecommendationScore[] {
  const candidates = getPartsByCategory(options.targetSlot);
  const limit = options.limit || 5;

  const scored = candidates.map((candidate) =>
    scorePart(candidate, options.currentBuild, options.targetSlot, options.strategy, options.budgetCapCents)
  );

  // Filter out incompatible parts and sort by score DESC
  const validCandidates = scored
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score);

  return validCandidates.slice(0, limit);
}

class RecommendationsService {
  getRecommendations(options: RecommendationOptions) {
    return getRecommendations(options);
  }

  trackRecommendationShown(partSlug: string, strategy: RecommendationStrategy, context: string) {
    logger.info("recommendation.shown", { partSlug, strategy, context });
    analytics.track("recommendation_shown", { partSlug, strategy, context });
  }

  trackRecommendationApplied(partSlug: string, strategy: RecommendationStrategy, context: string) {
    logger.info("recommendation.applied", { partSlug, strategy, context });
    analytics.track("recommendation_applied", { partSlug, strategy, context });
  }
}

export const recommendationsService = new RecommendationsService();
