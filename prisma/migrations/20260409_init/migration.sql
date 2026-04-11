-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PartCategory" AS ENUM ('CPU', 'MOTHERBOARD', 'GPU', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLER');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BuildVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "CompatibilityStatus" AS ENUM ('OK', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "BuildSlot" AS ENUM ('CPU', 'MOTHERBOARD', 'GPU', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLER');

-- CreateEnum
CREATE TYPE "BenchmarkKind" AS ENUM ('PART', 'BUILD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "bio" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "PartCategory" NOT NULL,
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "priceCents" INTEGER NOT NULL,
    "specs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "BuildStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "BuildVisibility" NOT NULL DEFAULT 'PRIVATE',
    "estimatedWattage" INTEGER NOT NULL DEFAULT 0,
    "totalPriceCents" INTEGER NOT NULL DEFAULT 0,
    "compatibilityStatus" "CompatibilityStatus" NOT NULL DEFAULT 'WARNING',
    "trendScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildPart" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "slot" "BuildSlot" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Benchmark" (
    "id" TEXT NOT NULL,
    "kind" "BenchmarkKind" NOT NULL,
    "title" TEXT NOT NULL,
    "workload" TEXT NOT NULL,
    "score" INTEGER,
    "avgFps" INTEGER,
    "notes" TEXT,
    "partId" TEXT,
    "buildId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Benchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ForumCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumQuestion" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "solvedAnswerId" TEXT,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "voteScore" INTEGER NOT NULL DEFAULT 0,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerVote" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnswerVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Part_slug_key" ON "Part"("slug");

-- CreateIndex
CREATE INDEX "Part_category_idx" ON "Part"("category");

-- CreateIndex
CREATE INDEX "Part_brand_idx" ON "Part"("brand");

-- CreateIndex
CREATE INDEX "Build_userId_idx" ON "Build"("userId");

-- CreateIndex
CREATE INDEX "Build_visibility_status_trendScore_idx" ON "Build"("visibility", "status", "trendScore");

-- CreateIndex
CREATE INDEX "BuildPart_buildId_idx" ON "BuildPart"("buildId");

-- CreateIndex
CREATE INDEX "BuildPart_partId_idx" ON "BuildPart"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug");

-- CreateIndex
CREATE INDEX "Benchmark_kind_idx" ON "Benchmark"("kind");

-- CreateIndex
CREATE INDEX "Benchmark_partId_idx" ON "Benchmark"("partId");

-- CreateIndex
CREATE INDEX "Benchmark_buildId_idx" ON "Benchmark"("buildId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCategory_slug_key" ON "ForumCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ForumQuestion_solvedAnswerId_key" ON "ForumQuestion"("solvedAnswerId");

-- CreateIndex
CREATE INDEX "ForumQuestion_categoryId_idx" ON "ForumQuestion"("categoryId");

-- CreateIndex
CREATE INDEX "ForumQuestion_authorId_idx" ON "ForumQuestion"("authorId");

-- CreateIndex
CREATE INDEX "ForumAnswer_questionId_idx" ON "ForumAnswer"("questionId");

-- CreateIndex
CREATE INDEX "ForumAnswer_authorId_idx" ON "ForumAnswer"("authorId");

-- CreateIndex
CREATE INDEX "AnswerVote_userId_idx" ON "AnswerVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerVote_answerId_userId_key" ON "AnswerVote"("answerId", "userId");

-- AddForeignKey
ALTER TABLE "Build" ADD CONSTRAINT "Build_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildPart" ADD CONSTRAINT "BuildPart_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildPart" ADD CONSTRAINT "BuildPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Benchmark" ADD CONSTRAINT "Benchmark_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Benchmark" ADD CONSTRAINT "Benchmark_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumQuestion" ADD CONSTRAINT "ForumQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ForumCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumQuestion" ADD CONSTRAINT "ForumQuestion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumQuestion" ADD CONSTRAINT "ForumQuestion_solvedAnswerId_fkey" FOREIGN KEY ("solvedAnswerId") REFERENCES "ForumAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumAnswer" ADD CONSTRAINT "ForumAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ForumQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumAnswer" ADD CONSTRAINT "ForumAnswer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerVote" ADD CONSTRAINT "AnswerVote_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ForumAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerVote" ADD CONSTRAINT "AnswerVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
