import type { PublicBenchmark } from "./public-content";

export type CompareResult = {
  winnerId: string | null;
  differencePercent: number | null;
  differenceAbsolute: number | null;
  isTie: boolean;
};

export function compareBenchmarks(a: PublicBenchmark, b: PublicBenchmark): CompareResult {
  const scoreA = a.avgFps ?? a.score ?? 0;
  const scoreB = b.avgFps ?? b.score ?? 0;

  if (scoreA === 0 && scoreB === 0) {
    return { winnerId: null, differencePercent: null, differenceAbsolute: null, isTie: true };
  }

  const isHigherBetter = (a.scoreType ?? "HigherIsBetter") === "HigherIsBetter";

  let winnerId: string | null = null;
  let isTie = false;

  if (scoreA === scoreB) {
    isTie = true;
  } else if (isHigherBetter) {
    winnerId = scoreA > scoreB ? a.id : b.id;
  } else {
    winnerId = scoreA < scoreB ? a.id : b.id;
  }

  const differenceAbsolute = Math.abs(scoreA - scoreB);
  let differencePercent: number | null = null;

  if (scoreA > 0 && scoreB > 0) {
    const min = Math.min(scoreA, scoreB);
    differencePercent = (differenceAbsolute / min) * 100;
  }

  return {
    winnerId,
    differencePercent,
    differenceAbsolute,
    isTie,
  };
}
