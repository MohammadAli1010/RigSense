import { analytics } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { errorReporting } from "@/lib/error-reporting";
import { logger } from "@/lib/logger";

type CreateQuestionInput = {
  authorId: string;
  categorySlug: string;
  title: string;
  body: string;
  tags?: string[];
};

type CreateAnswerInput = {
  authorId: string;
  questionId: string;
  body: string;
  parentId?: string | null;
};

type VoteAnswerInput = {
  userId: string;
  questionId: string;
  answerId: string;
  value: 1 | -1;
};

type MarkSolvedAnswerInput = {
  userId: string;
  questionId: string;
  answerId: string;
};

export type CreateQuestionResult =
  | { status: "created"; questionId: string }
  | { status: "seed-forum-required" };

export type CreateAnswerResult =
  | { status: "created"; questionId: string }
  | { status: "question-not-found" };

export type VoteAnswerResult =
  | { status: "updated"; questionId: string }
  | { status: "question-not-found" };

export type MarkSolvedAnswerResult =
  | { status: "marked"; questionId: string }
  | { status: "question-not-found" }
  | { status: "forbidden" };

export type CreateReportResult =
  | { status: "reported"; id: string }
  | { status: "invalid-input" };

export type ToggleSubscriptionResult =
  | { status: "subscribed"; questionId: string }
  | { status: "unsubscribed"; questionId: string }
  | { status: "question-not-found" };

export function sortAnswersByAcceptanceAndScore<T extends { isAccepted: boolean; voteScore: number }>(
  items: T[],
) {
  return [...items].sort((left, right) => {
    if (left.isAccepted && !right.isAccepted) {
      return -1;
    }

    if (!left.isAccepted && right.isAccepted) {
      return 1;
    }

    return right.voteScore - left.voteScore;
  });
}

export async function createQuestion(input: CreateQuestionInput): Promise<CreateQuestionResult> {
  try {
    const category = await prisma.forumCategory.findUnique({
      where: {
        slug: input.categorySlug,
      },
    });

    if (!category) {
      return {
        status: "seed-forum-required",
      };
    }

    const question = await prisma.forumQuestion.create({
      data: {
        categoryId: category.id,
        authorId: input.authorId,
        title: input.title,
        body: input.body,
        tags: input.tags ?? [],
        subscriptions: {
          create: [{ userId: input.authorId }],
        },
      },
    });

    logger.info("forum.question_created", {
      questionId: question.id,
      authorId: input.authorId,
      categorySlug: input.categorySlug,
    });
    analytics.track("forum_question_created", {
      questionId: question.id,
      authorId: input.authorId,
      categorySlug: input.categorySlug,
    });

    return {
      status: "created",
      questionId: question.id,
    };
  } catch (error) {
    errorReporting.captureException(error, {
      scope: "forum.create_question",
      authorId: input.authorId,
      categorySlug: input.categorySlug,
    });
    throw error;
  }
}

export async function createAnswer(input: CreateAnswerInput): Promise<CreateAnswerResult> {
  try {
    const question = await prisma.forumQuestion.findUnique({
      where: {
        id: input.questionId,
      },
    });

    if (!question) {
      return {
        status: "question-not-found",
      };
    }

    await prisma.$transaction([
      prisma.forumAnswer.create({
        data: {
          questionId: input.questionId,
          authorId: input.authorId,
          parentId: input.parentId ?? null,
          body: input.body,
        },
      }),
      prisma.forumQuestion.update({
        where: {
          id: input.questionId,
        },
        data: {
          answerCount: {
            increment: 1,
          },
        },
      }),
    ]);

    logger.info("forum.answer_created", {
      questionId: input.questionId,
      authorId: input.authorId,
    });
    analytics.track("forum_answer_created", {
      questionId: input.questionId,
      authorId: input.authorId,
    });

    return {
      status: "created",
      questionId: input.questionId,
    };
  } catch (error) {
    errorReporting.captureException(error, {
      scope: "forum.create_answer",
      authorId: input.authorId,
      questionId: input.questionId,
    });
    throw error;
  }
}

export async function voteAnswer(input: VoteAnswerInput): Promise<VoteAnswerResult> {
  try {
    const answer = await prisma.forumAnswer.findUnique({
      where: {
        id: input.answerId,
      },
    });

    if (!answer || answer.questionId !== input.questionId) {
      return {
        status: "question-not-found",
      };
    }

    const existingVote = await prisma.answerVote.findUnique({
      where: {
        answerId_userId: {
          answerId: input.answerId,
          userId: input.userId,
        },
      },
    });

    let delta: number = input.value;

    if (!existingVote) {
      await prisma.answerVote.create({
        data: {
          answerId: input.answerId,
          userId: input.userId,
          value: input.value,
        },
      });
    } else if (existingVote.value === input.value) {
      delta = -input.value;

      await prisma.answerVote.delete({
        where: {
          answerId_userId: {
            answerId: input.answerId,
            userId: input.userId,
          },
        },
      });
    } else {
      delta = input.value - existingVote.value;

      await prisma.answerVote.update({
        where: {
          answerId_userId: {
            answerId: input.answerId,
            userId: input.userId,
          },
        },
        data: {
          value: input.value,
        },
      });
    }

    await prisma.$transaction([
      prisma.forumAnswer.update({
        where: {
          id: input.answerId,
        },
        data: {
          voteScore: {
            increment: delta,
          },
        },
      }),
      prisma.user.update({
        where: {
          id: answer.authorId,
        },
        data: {
          reputationScore: {
            increment: delta,
          },
        },
      }),
    ]);

    logger.info("forum.answer_voted", {
      questionId: input.questionId,
      answerId: input.answerId,
      userId: input.userId,
      delta,
    });
    analytics.track("forum_answer_voted", {
      questionId: input.questionId,
      answerId: input.answerId,
      userId: input.userId,
      delta,
    });

    return {
      status: "updated",
      questionId: input.questionId,
    };
  } catch (error) {
    errorReporting.captureException(error, {
      scope: "forum.vote_answer",
      questionId: input.questionId,
      answerId: input.answerId,
      userId: input.userId,
    });
    throw error;
  }
}

export async function markSolvedAnswer(
  input: MarkSolvedAnswerInput,
): Promise<MarkSolvedAnswerResult> {
  try {
    const question = await prisma.forumQuestion.findUnique({
      where: {
        id: input.questionId,
      },
    });

    if (!question) {
      return {
        status: "question-not-found",
      };
    }

    if (question.authorId !== input.userId) {
      return {
        status: "forbidden",
      };
    }

    const answer = await prisma.forumAnswer.findUnique({
      where: {
        id: input.answerId,
      },
    });

    if (!answer || answer.questionId !== input.questionId) {
      return {
        status: "question-not-found",
      };
    }

    await prisma.$transaction([
      prisma.forumAnswer.updateMany({
        where: {
          questionId: input.questionId,
        },
        data: {
          isAccepted: false,
        },
      }),
      prisma.forumAnswer.update({
        where: {
          id: input.answerId,
        },
        data: {
          isAccepted: true,
        },
      }),
      prisma.forumQuestion.update({
        where: {
          id: input.questionId,
        },
        data: {
          solvedAnswerId: input.answerId,
        },
      }),
    ]);

    logger.info("forum.solved_answer_marked", {
      questionId: input.questionId,
      answerId: input.answerId,
      userId: input.userId,
    });
    analytics.track("forum_solved_answer_marked", {
      questionId: input.questionId,
      answerId: input.answerId,
      userId: input.userId,
    });

    return {
      status: "marked",
      questionId: input.questionId,
    };
  } catch (error) {
    errorReporting.captureException(error, {
      scope: "forum.mark_solved_answer",
      questionId: input.questionId,
      answerId: input.answerId,
      userId: input.userId,
    });
    throw error;
  }
}

export async function createReport(input: {
  reporterId: string;
  reason: string;
  questionId?: string;
  answerId?: string;
}): Promise<CreateReportResult> {
  try {
    if (!input.questionId && !input.answerId) {
      return { status: "invalid-input" };
    }

    const report = await prisma.report.create({
      data: {
        reporterId: input.reporterId,
        reason: input.reason,
        questionId: input.questionId || null,
        answerId: input.answerId || null,
      },
    });

    logger.info("forum.content_reported", {
      reportId: report.id,
      reporterId: input.reporterId,
      questionId: input.questionId,
      answerId: input.answerId,
    });

    analytics.track("forum_content_reported", {
      reportId: report.id,
      reporterId: input.reporterId,
      questionId: input.questionId,
      answerId: input.answerId,
    });

    return {
      status: "reported",
      id: report.id,
    };
  } catch (error) {
    errorReporting.captureException(error, {
      scope: "forum.create_report",
      reporterId: input.reporterId,
      questionId: input.questionId,
      answerId: input.answerId,
    });
    throw error;
  }
}

export async function toggleSubscription(input: {
  userId: string;
  questionId: string;
}): Promise<ToggleSubscriptionResult> {
  try {
    const question = await prisma.forumQuestion.findUnique({
      where: { id: input.questionId },
    });

    if (!question) {
      return { status: "question-not-found" };
    }

    const existing = await prisma.subscription.findUnique({
      where: {
        userId_questionId: {
          userId: input.userId,
          questionId: input.questionId,
        },
      },
    });

    if (existing) {
      await prisma.subscription.delete({
        where: { id: existing.id },
      });
      return { status: "unsubscribed", questionId: input.questionId };
    }

    await prisma.subscription.create({
      data: {
        userId: input.userId,
        questionId: input.questionId,
      },
    });

    return { status: "subscribed", questionId: input.questionId };
  } catch (error) {
    errorReporting.captureException(error, {
      scope: "forum.toggle_subscription",
      userId: input.userId,
      questionId: input.questionId,
    });
    throw error;
  }
}
