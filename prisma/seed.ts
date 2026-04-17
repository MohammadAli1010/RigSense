import { hash } from "bcryptjs";
import { BuildSlot, PrismaClient, type PartCategory } from "@prisma/client";

import {
  benchmarks,
  forumCategories,
  forumQuestions,
  getPartBySlug,
  guides,
  parts,
  personalBuilds,
  publicBuilds,
} from "../src/data/mock-data";

const prisma = new PrismaClient();

const slotByCategory: Record<PartCategory, BuildSlot> = {
  CPU: BuildSlot.CPU,
  MOTHERBOARD: BuildSlot.MOTHERBOARD,
  GPU: BuildSlot.GPU,
  RAM: BuildSlot.RAM,
  STORAGE: BuildSlot.STORAGE,
  PSU: BuildSlot.PSU,
  CASE: BuildSlot.CASE,
  COOLER: BuildSlot.COOLER,
};

function emailFromName(name: string) {
  if (name === "You") {
    return "demo@rigsense.dev";
  }

  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "")}@rigsense.dev`;
}

async function upsertUser(name: string) {
  const email = emailFromName(name);
  const passwordHash = await hash("rigsense123", 12);

  return prisma.user.upsert({
    where: {
      email,
    },
    update: {
      name,
      passwordHash,
    },
    create: {
      name,
      email,
      passwordHash,
    },
  });
}

async function seedUsers() {
  const names = new Set<string>(["You"]);

  for (const build of [...publicBuilds, ...personalBuilds]) {
    names.add(build.authorName);
  }

  for (const question of forumQuestions) {
    names.add(question.authorName);

    for (const answer of question.answers) {
      names.add(answer.authorName);
    }
  }

  const users = new Map<string, Awaited<ReturnType<typeof upsertUser>>>();

  for (const name of names) {
    const user = await upsertUser(name);
    users.set(name, user);
  }

  return users;
}

async function seedParts() {
  for (const part of parts) {
    await prisma.part.upsert({
      where: {
        slug: part.slug,
      },
      update: {
        brand: part.brand,
        category: part.category,
        name: part.name,
        description: part.description,
        priceCents: part.priceCents,
        specs: part.specs,
      },
      create: {
        slug: part.slug,
        brand: part.brand,
        category: part.category,
        name: part.name,
        description: part.description,
        priceCents: part.priceCents,
        specs: part.specs,
      },
    });
  }
}

async function seedGuides() {
  for (const guide of guides) {
    await prisma.guide.upsert({
      where: {
        slug: guide.slug,
      },
      update: {
        title: guide.title,
        excerpt: guide.excerpt,
        body: guide.content.join("\n\n"),
      },
      create: {
        slug: guide.slug,
        title: guide.title,
        excerpt: guide.excerpt,
        body: guide.content.join("\n\n"),
      },
    });
  }
}

async function seedBuilds(users: Map<string, Awaited<ReturnType<typeof upsertUser>>>) {
  for (const build of [...publicBuilds, ...personalBuilds]) {
    const author = users.get(build.authorName);

    if (!author) {
      throw new Error(`Missing author for build ${build.title}`);
    }

    await prisma.build.upsert({
      where: {
        id: build.id,
      },
      update: {
        userId: author.id,
        title: build.title,
        description: build.description,
        status: build.status,
        visibility: build.visibility,
        estimatedWattage: build.estimatedWattage,
        totalPriceCents: build.totalPriceCents,
        compatibilityStatus: build.compatibilityStatus,
        trendScore: build.trendScore,
        intendedUse: build.intendedUse,
        performanceTier: build.performanceTier,
      },
      create: {
        id: build.id,
        userId: author.id,
        title: build.title,
        description: build.description,
        status: build.status,
        visibility: build.visibility,
        estimatedWattage: build.estimatedWattage,
        totalPriceCents: build.totalPriceCents,
        compatibilityStatus: build.compatibilityStatus,
        trendScore: build.trendScore,
        intendedUse: build.intendedUse,
        performanceTier: build.performanceTier,
      },
    });

    await prisma.buildPart.deleteMany({
      where: {
        buildId: build.id,
      },
    });

    for (const slug of build.partSlugs) {
      const sourcePart = getPartBySlug(slug);

      if (!sourcePart) {
        continue;
      }

      const dbPart = await prisma.part.findUnique({
        where: {
          slug,
        },
      });

      if (!dbPart) {
        continue;
      }

      await prisma.buildPart.create({
        data: {
          buildId: build.id,
          partId: dbPart.id,
          slot: slotByCategory[sourcePart.category],
          quantity: 1,
        },
      });
    }
  }
}

async function seedBenchmarks() {
  for (const benchmark of benchmarks) {
    const part = benchmark.partSlug
      ? await prisma.part.findUnique({ where: { slug: benchmark.partSlug } })
      : null;

    await prisma.benchmark.upsert({
      where: {
        id: benchmark.id,
      },
      update: {
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
        partId: part?.id ?? null,
        buildId: benchmark.buildId ?? null,
      },
      create: {
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
        partId: part?.id ?? null,
        buildId: benchmark.buildId ?? null,
      },
    });
  }
}

async function seedForum(users: Map<string, Awaited<ReturnType<typeof upsertUser>>>) {
  for (const category of forumCategories) {
    await prisma.forumCategory.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        description: category.description,
      },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
      },
    });
  }

  for (const question of forumQuestions) {
    const category = await prisma.forumCategory.findUnique({
      where: {
        slug: question.categorySlug,
      },
    });
    const author = users.get(question.authorName);

    if (!category || !author) {
      throw new Error(`Missing forum relation for question ${question.id}`);
    }

    await prisma.forumQuestion.upsert({
      where: {
        id: question.id,
      },
      update: {
        categoryId: category.id,
        authorId: author.id,
        title: question.title,
        body: question.body,
        viewCount: question.viewCount,
        answerCount: question.answers.length,
        solvedAnswerId: null,
      },
      create: {
        id: question.id,
        categoryId: category.id,
        authorId: author.id,
        title: question.title,
        body: question.body,
        viewCount: question.viewCount,
        answerCount: question.answers.length,
      },
    });

    for (const answer of question.answers) {
      const answerAuthor = users.get(answer.authorName);

      if (!answerAuthor) {
        throw new Error(`Missing answer author for ${answer.id}`);
      }

      await prisma.forumAnswer.upsert({
        where: {
          id: answer.id,
        },
        update: {
          questionId: question.id,
          authorId: answerAuthor.id,
          body: answer.body,
          voteScore: answer.voteScore,
          isAccepted: answer.isAccepted,
        },
        create: {
          id: answer.id,
          questionId: question.id,
          authorId: answerAuthor.id,
          body: answer.body,
          voteScore: answer.voteScore,
          isAccepted: answer.isAccepted,
        },
      });
    }

    const acceptedAnswer = question.answers.find((answer) => answer.isAccepted);

    await prisma.forumQuestion.update({
      where: {
        id: question.id,
      },
      data: {
        answerCount: question.answers.length,
        solvedAnswerId: acceptedAnswer?.id ?? null,
      },
    });
  }
}

async function main() {
  const users = await seedUsers();

  await seedParts();
  await seedGuides();
  await seedBuilds(users);
  await seedBenchmarks();
  await seedForum(users);

  console.log("RigSense seed data is ready.");
  console.log("Demo login: demo@rigsense.dev / rigsense123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
