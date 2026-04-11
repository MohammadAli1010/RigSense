"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const questionSchema = z.object({
  title: z.string().trim().min(8).max(120),
  body: z.string().trim().min(20).max(2000),
});

const answerSchema = z.object({
  body: z.string().trim().min(10).max(2000),
});

function redirectToCategory(category: string, status?: string): never {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  redirect(`/forum/${category}${params.size > 0 ? `?${params.toString()}` : ""}`);
}

function redirectToQuestion(questionId: string, status?: string): never {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  redirect(`/forum/questions/${questionId}${params.size > 0 ? `?${params.toString()}` : ""}`);
}

export async function createQuestionAction(formData: FormData) {
  const user = await requireUser();
  const categorySlug = String(formData.get("categorySlug") ?? "").trim();
  const parsed = questionSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!categorySlug) {
    redirect("/forum");
  }

  if (!parsed.success) {
    redirectToCategory(categorySlug, "question-invalid");
  }

  const category = await prisma.forumCategory.findUnique({
    where: {
      slug: categorySlug,
    },
  });

  if (!category) {
    redirectToCategory(categorySlug, "seed-forum-required");
  }

  const question = await prisma.forumQuestion.create({
    data: {
      categoryId: category.id,
      authorId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
    },
  });

  redirectToQuestion(question.id, "question-posted");
}

export async function createAnswerAction(formData: FormData) {
  const user = await requireUser();
  const questionId = String(formData.get("questionId") ?? "").trim();
  const parsed = answerSchema.safeParse({
    body: formData.get("body"),
  });

  if (!questionId) {
    redirect("/forum");
  }

  if (!parsed.success) {
    redirectToQuestion(questionId, "answer-invalid");
  }

  const question = await prisma.forumQuestion.findUnique({
    where: {
      id: questionId,
    },
  });

  if (!question) {
    redirect("/forum");
  }

  await prisma.$transaction([
    prisma.forumAnswer.create({
      data: {
        questionId,
        authorId: user.id,
        body: parsed.data.body,
      },
    }),
    prisma.forumQuestion.update({
      where: {
        id: questionId,
      },
      data: {
        answerCount: {
          increment: 1,
        },
      },
    }),
  ]);

  redirectToQuestion(questionId, "answer-posted");
}

export async function voteAnswerAction(formData: FormData) {
  const user = await requireUser();
  const questionId = String(formData.get("questionId") ?? "").trim();
  const answerId = String(formData.get("answerId") ?? "").trim();
  const value = Number(formData.get("value"));

  if (!questionId || !answerId || ![1, -1].includes(value)) {
    redirect("/forum");
  }

  const answer = await prisma.forumAnswer.findUnique({
    where: {
      id: answerId,
    },
  });

  if (!answer || answer.questionId !== questionId) {
    redirectToQuestion(questionId);
  }

  const existingVote = await prisma.answerVote.findUnique({
    where: {
      answerId_userId: {
        answerId,
        userId: user.id,
      },
    },
  });

  let delta = value;

  if (!existingVote) {
    await prisma.answerVote.create({
      data: {
        answerId,
        userId: user.id,
        value,
      },
    });
  } else if (existingVote.value === value) {
    delta = -value;

    await prisma.answerVote.delete({
      where: {
        answerId_userId: {
          answerId,
          userId: user.id,
        },
      },
    });
  } else {
    delta = value - existingVote.value;

    await prisma.answerVote.update({
      where: {
        answerId_userId: {
          answerId,
          userId: user.id,
        },
      },
      data: {
        value,
      },
    });
  }

  await prisma.forumAnswer.update({
    where: {
      id: answerId,
    },
    data: {
      voteScore: {
        increment: delta,
      },
    },
  });

  redirectToQuestion(questionId);
}

export async function markSolvedAnswerAction(formData: FormData) {
  const user = await requireUser();
  const questionId = String(formData.get("questionId") ?? "").trim();
  const answerId = String(formData.get("answerId") ?? "").trim();

  if (!questionId || !answerId) {
    redirect("/forum");
  }

  const question = await prisma.forumQuestion.findUnique({
    where: {
      id: questionId,
    },
  });

  if (!question) {
    redirect("/forum");
  }

  if (question.authorId !== user.id) {
    redirectToQuestion(questionId);
  }

  const answer = await prisma.forumAnswer.findUnique({
    where: {
      id: answerId,
    },
  });

  if (!answer || answer.questionId !== questionId) {
    redirectToQuestion(questionId);
  }

  await prisma.$transaction([
    prisma.forumAnswer.updateMany({
      where: {
        questionId,
      },
      data: {
        isAccepted: false,
      },
    }),
    prisma.forumAnswer.update({
      where: {
        id: answerId,
      },
      data: {
        isAccepted: true,
      },
    }),
    prisma.forumQuestion.update({
      where: {
        id: questionId,
      },
      data: {
        solvedAnswerId: answerId,
      },
    }),
  ]);

  redirectToQuestion(questionId, "solved-marked");
}
