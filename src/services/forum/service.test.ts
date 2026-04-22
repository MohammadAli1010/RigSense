import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, analyticsMock, errorReportingMock, loggerMock } = vi.hoisted(() => ({
  prismaMock: {
    forumCategory: {
      findUnique: vi.fn(),
    },
    forumQuestion: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    forumAnswer: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    answerVote: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  analyticsMock: {
    track: vi.fn(),
  },
  errorReportingMock: {
    captureException: vi.fn(),
  },
  loggerMock: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/analytics", () => ({
  analytics: analyticsMock,
}));

vi.mock("@/lib/error-reporting", () => ({
  errorReporting: errorReportingMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: loggerMock,
}));

import {
  createAnswer,
  createQuestion,
  markSolvedAnswer,
  voteAnswer,
} from "@/services/forum/service";

describe("forum service", () => {
  beforeEach(() => {
    prismaMock.forumCategory.findUnique.mockReset();
    prismaMock.forumQuestion.findUnique.mockReset();
    prismaMock.forumQuestion.create.mockReset();
    prismaMock.forumQuestion.update.mockReset();
    prismaMock.forumAnswer.findUnique.mockReset();
    prismaMock.forumAnswer.create.mockReset();
    prismaMock.forumAnswer.update.mockReset();
    prismaMock.forumAnswer.updateMany.mockReset();
    prismaMock.answerVote.findUnique.mockReset();
    prismaMock.answerVote.create.mockReset();
    prismaMock.answerVote.delete.mockReset();
    prismaMock.answerVote.update.mockReset();
    prismaMock.user.update.mockReset();
    prismaMock.$transaction.mockReset();
  });

  it("returns a seed error when the category does not exist", async () => {
    prismaMock.forumCategory.findUnique.mockResolvedValue(null);

    const result = await createQuestion({
      authorId: "user-1",
      categorySlug: "general",
      title: "Question title",
      body: "Question body with enough detail.",
    });

    expect(result).toEqual({
      status: "seed-forum-required",
    });
  });

  it("creates an answer and increments the question answer count", async () => {
    prismaMock.forumQuestion.findUnique.mockResolvedValue({
      id: "question-1",
    });
    prismaMock.$transaction.mockResolvedValue([]);

    const result = await createAnswer({
      authorId: "user-1",
      questionId: "question-1",
      body: "Detailed answer body.",
    });

    expect(result).toEqual({
      status: "created",
      questionId: "question-1",
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("toggles an existing vote off when the same vote is submitted again", async () => {
    prismaMock.forumAnswer.findUnique.mockResolvedValue({
      id: "answer-1",
      questionId: "question-1",
    });
    prismaMock.answerVote.findUnique.mockResolvedValue({
      answerId: "answer-1",
      userId: "user-1",
      value: 1,
    });
    prismaMock.answerVote.delete.mockResolvedValue({ id: "vote-1" });
    prismaMock.forumAnswer.update.mockResolvedValue({ id: "answer-1" });

    const result = await voteAnswer({
      userId: "user-1",
      questionId: "question-1",
      answerId: "answer-1",
      value: 1,
    });

    expect(result).toEqual({
      status: "updated",
      questionId: "question-1",
    });
    expect(prismaMock.forumAnswer.update).toHaveBeenCalledWith({
      where: {
        id: "answer-1",
      },
      data: {
        voteScore: {
          increment: -1,
        },
      },
    });
  });

  it("prevents non-owners from marking solved answers", async () => {
    prismaMock.forumQuestion.findUnique.mockResolvedValue({
      id: "question-1",
      authorId: "another-user",
    });

    const result = await markSolvedAnswer({
      userId: "user-1",
      questionId: "question-1",
      answerId: "answer-1",
    });

    expect(result).toEqual({
      status: "forbidden",
    });
  });
});
