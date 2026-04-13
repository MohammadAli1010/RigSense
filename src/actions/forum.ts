"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/session";
import {
  createAnswer,
  createQuestion,
  markSolvedAnswer,
  voteAnswer,
} from "@/services/forum/service";

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

  const result = await createQuestion({
    authorId: user.id,
    categorySlug,
    title: parsed.data.title,
    body: parsed.data.body,
  });

  if (result.status === "seed-forum-required") {
    redirectToCategory(categorySlug, "seed-forum-required");
  }

  redirectToQuestion(result.questionId, "question-posted");
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

  const result = await createAnswer({
    authorId: user.id,
    questionId,
    body: parsed.data.body,
  });

  if (result.status === "question-not-found") {
    redirect("/forum");
  }

  redirectToQuestion(result.questionId, "answer-posted");
}

export async function voteAnswerAction(formData: FormData) {
  const user = await requireUser();
  const questionId = String(formData.get("questionId") ?? "").trim();
  const answerId = String(formData.get("answerId") ?? "").trim();
  const value = Number(formData.get("value"));

  if (!questionId || !answerId || ![1, -1].includes(value)) {
    redirect("/forum");
  }

  const result = await voteAnswer({
    userId: user.id,
    questionId,
    answerId,
    value: value as 1 | -1,
  });

  if (result.status === "question-not-found") {
    redirectToQuestion(questionId);
  }

  redirectToQuestion(result.questionId);
}

export async function markSolvedAnswerAction(formData: FormData) {
  const user = await requireUser();
  const questionId = String(formData.get("questionId") ?? "").trim();
  const answerId = String(formData.get("answerId") ?? "").trim();

  if (!questionId || !answerId) {
    redirect("/forum");
  }

  const result = await markSolvedAnswer({
    userId: user.id,
    questionId,
    answerId,
  });

  if (result.status === "question-not-found") {
    redirect("/forum");
  }

  if (result.status === "forbidden") {
    redirectToQuestion(questionId);
  }

  redirectToQuestion(result.questionId, "solved-marked");
}
