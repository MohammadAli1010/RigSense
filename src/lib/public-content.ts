import {
  BenchmarkKind,
  BuildStatus,
  BuildVisibility,
  PartCategory,
  type Benchmark,
  type Guide,
  type Part,
} from "@prisma/client";

import {
  benchmarks as mockBenchmarks,
  categoryMeta,
  getCategory,
  getCategoryPathForCategory,
  getFeaturedParts,
  getGuideBySlug,
  getPartByCategoryAndSlug,
  getPartBySlug,
  getPartsByCategory,
  getRecentQuestions,
  getTrendingBuilds,
  guides as mockGuides,
  publicBuilds,
} from "@/data/mock-data";
import { getRecommendations } from "@/services/recommendations/service";
import { safeDatabaseQuery } from "@/lib/database-reachability";
import { prisma } from "@/lib/db";

type SpecValue = number | string | string[];

export type PublicPart = {
  slug: string;
  category: PartCategory;
  categoryPath: string;
  brand: string;
  name: string;
  description: string;
  priceCents: number;
  priceSource?: string;
  lastUpdated?: Date;
  specs: Record<string, SpecValue>;
  highlights: string[];
};

export type PublicGuide = {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  tags: string[];
  content: string[];
};

export type PublicBenchmark = {
  id: string;
  title: string;
  workload: string;
  score: number | null;
  avgFps: number | null;
  unit: string | null;
  scoreType: string | null;
  source: string | null;
  resolution: string | null;
  settings: string | null;
  confidence: string | null;
  notes: string;
};

export type PublicBuild = {
  id: string;
  title: string;
  description: string;
  trendScore: number;
  totalPriceCents: number;
  estimatedWattage: number;
  visibility: BuildVisibility;
  status: BuildStatus;
  compatibilityStatus: string;
  authorName: string;
  tags: string[];
  intendedUse?: string | null;
  performanceTier?: string | null;
};

export type PublicQuestionSummary = {
  id: string;
  title: string;
  body: string;
  answerCount: number;
  viewCount: number;
  authorName: string;
};

async function safeQuery<T>(query: () => Promise<T>) {
  return safeDatabaseQuery(query, {
    label: "public-content",
  });
}

export function normalizeSpecs(value: unknown): Record<string, SpecValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, SpecValue> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" || typeof entry === "number") {
      result[key] = entry;
      continue;
    }

    if (Array.isArray(entry) && entry.every((item) => typeof item === "string")) {
      result[key] = entry;
    }
  }

  return result;
}

export function derivePartHighlights(specs: Record<string, SpecValue>) {
  return Object.values(specs)
    .slice(0, 3)
    .map((value) => (Array.isArray(value) ? value.join(" / ") : String(value)));
}

function normalizePart(part: Part): PublicPart {
  const mockPart = getPartBySlug(part.slug);
  const specs = normalizeSpecs(part.specs);

  return {
    slug: part.slug,
    category: part.category,
    categoryPath: getCategoryPathForCategory(part.category) ?? "parts",
    brand: part.brand,
    name: part.name,
    description: part.description ?? "No description available yet.",
    priceCents: part.priceCents,
    priceSource: ("priceSource" in part ? part.priceSource : null) ?? undefined,
    lastUpdated: ("lastUpdated" in part ? part.lastUpdated : null) ?? part.updatedAt,
    specs,
    highlights: mockPart?.highlights ?? derivePartHighlights(specs),
  };
}

export function estimateReadTime(text: string) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 220));

  return `${minutes} min read`;
}

function normalizeGuide(guide: Guide): PublicGuide {
  const mockGuide = getGuideBySlug(guide.slug);
  const paragraphs = guide.body.split(/\n\n+/).filter(Boolean);

  return {
    slug: guide.slug,
    title: guide.title,
    excerpt: guide.excerpt,
    readTime: mockGuide?.readTime ?? estimateReadTime(guide.body),
    tags: mockGuide?.tags ?? [],
    content: mockGuide?.content ?? paragraphs,
  };
}

function normalizeBenchmark(benchmark: Benchmark): PublicBenchmark {
  return {
    id: benchmark.id,
    title: benchmark.title,
    workload: benchmark.workload,
    score: benchmark.score,
    avgFps: benchmark.avgFps,
    unit: benchmark.unit,
    scoreType: benchmark.scoreType,
    source: benchmark.source,
    resolution: benchmark.resolution,
    settings: benchmark.settings,
    confidence: benchmark.confidence,
    notes: benchmark.notes ?? "",
  };
}

function normalizeBenchmarkRow(benchmark: {
  id: string;
  title: string;
  workload: string;
  score: number | null;
  avgFps: number | null;
  unit?: string | null;
  scoreType?: string | null;
  source?: string | null;
  resolution?: string | null;
  settings?: string | null;
  confidence?: string | null;
  notes: string;
}): PublicBenchmark {
  return {
    id: benchmark.id,
    title: benchmark.title,
    workload: benchmark.workload,
    score: benchmark.score,
    avgFps: benchmark.avgFps,
    unit: benchmark.unit ?? null,
    scoreType: benchmark.scoreType ?? null,
    source: benchmark.source ?? null,
    resolution: benchmark.resolution ?? null,
    settings: benchmark.settings ?? null,
    confidence: benchmark.confidence ?? null,
    notes: benchmark.notes,
  };
}

function deriveBuildTags(build: {
  id: string;
  compatibilityStatus: string;
  estimatedWattage: number;
}) {
  const mockBuild = publicBuilds.find((item) => item.id === build.id);

  if (mockBuild) {
    return mockBuild.tags;
  }

  return [build.compatibilityStatus, `${build.estimatedWattage}W`, "Community build"];
}

export async function getPartsOverviewData() {
  const dbParts = await safeQuery(() =>
    prisma.part.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  );

  if (!dbParts || dbParts.length === 0) {
    return {
      categories: categoryMeta.map((category) => ({
        ...category,
        count: getPartsByCategory(category.path).length,
      })),
      featuredParts: getFeaturedParts(),
    };
  }

  const normalizedParts = dbParts.map(normalizePart);
  const featuredParts = normalizedParts.filter((part) => getPartBySlug(part.slug)?.featured);

  return {
    categories: categoryMeta.map((category) => ({
      ...category,
      count: normalizedParts.filter((part) => part.category === category.category).length,
    })),
    featuredParts: (featuredParts.length > 0 ? featuredParts : normalizedParts).slice(0, 8),
  };
}

export async function getPartCategoryData(
  categoryPath: string,
  search?: string,
  sort?: string,
  page = 1,
  limit = 20
) {
  const categoryInfo = getCategory(categoryPath);

  if (!categoryInfo) {
    return null;
  }

  const where: any = { category: categoryInfo.category };
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const orderBy: any = {};
  if (sort === "price-asc") orderBy.priceCents = "asc";
  else if (sort === "price-desc") orderBy.priceCents = "desc";
  else orderBy.name = "asc";

  const dbParts = await safeQuery(() =>
    prisma.part.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  );

  const total = await safeQuery(() => prisma.part.count({ where })) || 0;

  return {
    categoryInfo,
    parts:
      dbParts && dbParts.length > 0
        ? dbParts.map(normalizePart)
        : getPartsByCategory(categoryPath),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPartDetailData(categoryPath: string, slug: string) {
  const categoryInfo = getCategory(categoryPath);

  if (!categoryInfo) {
    return null;
  }

  const dbPart = await safeQuery(() =>
    prisma.part.findUnique({
      where: {
        slug,
      },
    }),
  );

  const mockPartBase = getPartByCategoryAndSlug(categoryPath, slug);

  if (dbPart && dbPart.category === categoryInfo.category) {
    const relatedBenchmarks = await safeQuery(() =>
      prisma.benchmark.findMany({
        where: {
          partId: dbPart.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    );

    let finalRelatedParts: PublicPart[] = [];
    if (mockPartBase) {
      const recommended = getRecommendations({
        strategy: "balanced",
        targetSlot: categoryPath as any,
        currentBuild: { storage: [] },
        budgetCapCents: mockPartBase.priceCents * 1.5,
        limit: 5
      }).filter(r => r.part.slug !== slug).slice(0, 4).map(r => r.part);
      
      if (recommended.length > 0) {
         const dbRelatedParts = await safeQuery(() => 
           prisma.part.findMany({
             where: { slug: { in: recommended.map(p => p.slug) } }
           })
         );
         finalRelatedParts = recommended.map(rp => {
            const dbMatch = dbRelatedParts?.find(dbp => dbp.slug === rp.slug);
            return dbMatch ? normalizePart(dbMatch) : rp as any;
         });
      }
    }
    
    if (finalRelatedParts.length === 0) {
      const fallbackRelated = await safeQuery(() =>
        prisma.part.findMany({
          where: { category: dbPart.category, slug: { not: slug } },
          orderBy: { name: "asc" },
          take: 4,
        })
      );
      finalRelatedParts = fallbackRelated ? fallbackRelated.map(normalizePart) : [];
    }

    return {
      categoryInfo,
      part: normalizePart(dbPart),
      relatedParts: finalRelatedParts,
      benchmarks:
        relatedBenchmarks && relatedBenchmarks.length > 0
          ? relatedBenchmarks.map(normalizeBenchmark)
          : mockBenchmarks
              .filter((benchmark) => benchmark.partSlug === slug)
              .map((benchmark) =>
                normalizeBenchmarkRow({
                  ...benchmark,
                  score: benchmark.score ?? null,
                  avgFps: benchmark.avgFps ?? null,
                })
              ),
    };
  }

  if (!mockPartBase) {
    return null;
  }
  
  const recommended = getRecommendations({
    strategy: "balanced",
    targetSlot: categoryPath as any,
    currentBuild: { storage: [] },
    budgetCapCents: mockPartBase.priceCents * 1.5,
    limit: 5
  }).filter(r => r.part.slug !== slug).slice(0, 4).map(r => r.part as any);

  return {
    categoryInfo,
    part: mockPartBase,
    relatedParts: recommended.length > 0 ? recommended : getPartsByCategory(categoryPath).filter((part) => part.slug !== slug).slice(0, 4),
    benchmarks: mockBenchmarks
      .filter((benchmark) => benchmark.partSlug === slug)
      .map((benchmark) =>
        normalizeBenchmarkRow({
          ...benchmark,
          score: benchmark.score ?? null,
          avgFps: benchmark.avgFps ?? null,
        })
      ),
  };
}

export async function getGuidesOverviewData() {
  const dbGuides = await safeQuery(() =>
    prisma.guide.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
  );

  return dbGuides && dbGuides.length > 0 ? dbGuides.map(normalizeGuide) : mockGuides;
}

export async function getGuideDetailData(slug: string) {
  const dbGuide = await safeQuery(() =>
    prisma.guide.findUnique({
      where: {
        slug,
      },
    }),
  );

  if (dbGuide) {
    return normalizeGuide(dbGuide);
  }

  return getGuideBySlug(slug) ?? null;
}

export async function getBenchmarksOverviewData() {
  const dbBenchmarks = await safeQuery(() =>
    prisma.benchmark.findMany({
      orderBy: [{ kind: "asc" }, { createdAt: "desc" }],
    }),
  );

  const rows =
    dbBenchmarks && dbBenchmarks.length > 0
      ? dbBenchmarks
      : mockBenchmarks.map((benchmark) => ({
          id: benchmark.id,
          kind: benchmark.kind,
          title: benchmark.title,
          workload: benchmark.workload,
          score: benchmark.score ?? null,
          avgFps: benchmark.avgFps ?? null,
          unit: benchmark.unit ?? null,
          scoreType: benchmark.scoreType ?? null,
          source: benchmark.source ?? null,
          resolution: benchmark.resolution ?? null,
          settings: benchmark.settings ?? null,
          confidence: benchmark.confidence ?? null,
          notes: benchmark.notes,
        }));

  return {
    partBenchmarks: rows
      .filter((benchmark) => benchmark.kind === BenchmarkKind.PART)
      .map((benchmark) =>
        "createdAt" in benchmark ? normalizeBenchmark(benchmark) : normalizeBenchmarkRow(benchmark),
      ),
    buildBenchmarks: rows
      .filter((benchmark) => benchmark.kind === BenchmarkKind.BUILD)
      .map((benchmark) =>
        "createdAt" in benchmark ? normalizeBenchmark(benchmark) : normalizeBenchmarkRow(benchmark),
      ),
  };
}

export async function getTrendingBuildsOverviewData() {
  const dbBuilds = await safeQuery(() =>
    prisma.build.findMany({
      where: {
        visibility: BuildVisibility.PUBLIC,
        status: BuildStatus.COMPLETED,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        trendScore: "desc",
      },
    }),
  );

  if (!dbBuilds || dbBuilds.length === 0) {
    return getTrendingBuilds();
  }

  return dbBuilds.map((build) => ({
    id: build.id,
    title: build.title,
    description: build.description ?? "No build notes added yet.",
    trendScore: build.trendScore,
    totalPriceCents: build.totalPriceCents,
    estimatedWattage: build.estimatedWattage,
    visibility: build.visibility,
    status: build.status,
    compatibilityStatus: build.compatibilityStatus,
    authorName: build.user.name,
    tags: deriveBuildTags(build),
    intendedUse: build.intendedUse,
    performanceTier: build.performanceTier,
  }));
}

export async function getHomePageData() {
  const [partsOverview, guidesOverview, trendingBuilds, dbQuestions, counts] = await Promise.all([
    getPartsOverviewData(),
    getGuidesOverviewData(),
    getTrendingBuildsOverviewData(),
    safeQuery(() =>
      prisma.forumQuestion.findMany({
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
      }),
    ),
    safeQuery(async () => {
      const [partCount, guideCount, publicBuildCount, questionCount] = await prisma.$transaction([
        prisma.part.count(),
        prisma.guide.count(),
        prisma.build.count({
          where: {
            visibility: BuildVisibility.PUBLIC,
            status: BuildStatus.COMPLETED,
          },
        }),
        prisma.forumQuestion.count(),
      ]);

      return { partCount, guideCount, publicBuildCount, questionCount };
    }),
  ]);

  return {
    categoryCards: partsOverview.categories,
    featuredParts: partsOverview.featuredParts.slice(0, 4),
    guides: guidesOverview.slice(0, 2),
    trendingBuilds: trendingBuilds.slice(0, 2),
    recentQuestions:
      dbQuestions && dbQuestions.length > 0
        ? dbQuestions.map((question) => ({
            id: question.id,
            title: question.title,
            body: question.body,
            answerCount: question.answerCount,
            viewCount: question.viewCount,
            authorName: question.author.name,
          }))
        : getRecentQuestions().slice(0, 3).map((question) => ({
            id: question.id,
            title: question.title,
            body: question.body,
            answerCount: question.answers.length,
            viewCount: question.viewCount,
            authorName: question.authorName,
          })),
    stats: counts
      ? [
          { label: "Seeded parts", value: String(counts.partCount) },
          { label: "Guides", value: String(counts.guideCount) },
          { label: "Public builds", value: String(counts.publicBuildCount) },
          { label: "Forum questions", value: String(counts.questionCount) },
        ]
      : [
          { label: "Seeded parts", value: String(partsOverview.categories.reduce((sum, item) => sum + item.count, 0)) },
          { label: "Guides", value: String(guidesOverview.length) },
          { label: "Public builds", value: String(trendingBuilds.length) },
          { label: "Forum questions", value: String(getRecentQuestions().length) },
        ],
  };
}

export async function getUserProfileData(userId: string) {
  const user = await safeQuery(() =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        bio: true,
        imageUrl: true,
        createdAt: true,
        _count: {
          select: {
            builds: { where: { visibility: "PUBLIC" } },
            questions: true,
            answers: true,
          },
        },
        builds: {
          where: { visibility: "PUBLIC" },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        questions: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            createdAt: true,
            viewCount: true,
            _count: {
              select: { answers: true },
            },
          },
        },
      },
    }),
  );

  if (!user) {
    return null;
  }

  // Calculate a mock "reputation" or use actual sum of answer votes
  const answerVotes = await safeQuery(() =>
    prisma.answerVote.aggregate({
      where: { answer: { authorId: userId } },
      _sum: { value: true },
    })
  );

  const reputation = (answerVotes?._sum?.value ?? 0) * 10; // Simple rep calculation

  return {
    id: user.id,
    name: user.name,
    bio: user.bio ?? "This user hasn't added a bio yet.",
    imageUrl: user.imageUrl,
    joinedAt: user.createdAt,
    stats: {
      publicBuilds: user._count.builds,
      questions: user._count.questions,
      answers: user._count.answers,
      reputation,
    },
    builds: user.builds.map((build) => ({
      id: build.id,
      title: build.title,
      description: build.description ?? "No build notes added.",
      trendScore: build.trendScore,
      totalPriceCents: build.totalPriceCents,
      estimatedWattage: build.estimatedWattage,
      visibility: build.visibility,
      status: build.status,
      compatibilityStatus: build.compatibilityStatus,
      authorName: user.name,
      tags: deriveBuildTags(build),
      intendedUse: build.intendedUse,
      performanceTier: build.performanceTier,
    })),
    recentQuestions: user.questions.map((q) => ({
      id: q.id,
      title: q.title,
      createdAt: q.createdAt,
      viewCount: q.viewCount,
      answerCount: q._count.answers,
    })),
  };
}

export async function getComparePartsData(slugs: string[]) {
  if (!slugs.length) return [];

  const dbParts = await safeQuery(() =>
    prisma.part.findMany({
      where: {
        slug: { in: slugs },
      },
      include: {
        benchmarks: true,
      },
    }),
  );

  if (!dbParts || dbParts.length === 0) {
    // mock fallback
    const mockParts = slugs.map((slug) => getPartBySlug(slug)).filter(Boolean);
    return mockParts.map((mockPart) => {
      const partBenchmarks = mockBenchmarks
        .filter((b) => b.partSlug === mockPart?.slug)
        .map((b) =>
          normalizeBenchmarkRow({
            ...b,
            score: b.score ?? null,
            avgFps: b.avgFps ?? null,
            unit: b.unit ?? null,
            scoreType: b.scoreType ?? null,
            source: b.source ?? null,
            resolution: b.resolution ?? null,
            settings: b.settings ?? null,
            confidence: b.confidence ?? null,
          }),
        );
      
      return {
        part: {
          slug: mockPart!.slug,
          category: mockPart!.category,
          categoryPath: mockPart!.categoryPath,
          brand: mockPart!.brand,
          name: mockPart!.name,
          description: mockPart!.description,
          priceCents: mockPart!.priceCents,
          specs: mockPart!.specs as Record<string, SpecValue>,
          highlights: mockPart!.highlights,
        },
        benchmarks: partBenchmarks,
      };
    });
  }

  // we have db parts
  return dbParts.map((dbPart) => {
    const normalizedPart = normalizePart(dbPart);
    const relatedBenchmarks = dbPart.benchmarks.map(normalizeBenchmark);
    
    // Mix in mock benchmarks if none in DB (for seed consistency)
    const finalBenchmarks =
      relatedBenchmarks.length > 0
        ? relatedBenchmarks
        : mockBenchmarks
            .filter((b) => b.partSlug === normalizedPart.slug)
            .map((b) =>
              normalizeBenchmarkRow({
                ...b,
                score: b.score ?? null,
                avgFps: b.avgFps ?? null,
                unit: b.unit ?? null,
                scoreType: b.scoreType ?? null,
                source: b.source ?? null,
                resolution: b.resolution ?? null,
                settings: b.settings ?? null,
                confidence: b.confidence ?? null,
              }),
            );

    return {
      part: normalizedPart,
      benchmarks: finalBenchmarks,
    };
  });
}

