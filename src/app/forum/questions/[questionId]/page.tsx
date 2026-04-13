import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createAnswerAction,
  markSolvedAnswerAction,
  voteAnswerAction,
} from "@/actions/forum";
import { auth } from "@/auth";
import { getForumQuestionById } from "@/data/mock-data";
import { safeDatabaseQuery } from "@/lib/database-reachability";
import { prisma } from "@/lib/db";
import { sortAnswersByAcceptanceAndScore } from "@/services/forum/service";

type ForumQuestionPageProps = {
  params: Promise<{
    questionId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

function getStatusMessage(status?: string) {
  switch (status) {
    case "question-posted":
      return "Question posted successfully.";
    case "answer-posted":
      return "Answer posted successfully.";
    case "answer-invalid":
      return "Add a little more detail before posting the answer.";
    case "solved-marked":
      return "Solved answer updated.";
    default:
      return null;
  }
}

export default async function ForumQuestionPage({
  params,
  searchParams,
}: ForumQuestionPageProps) {
  const { questionId } = await params;
  const { status } = await searchParams;
  const session = await auth();
  const dbQuestion = await safeDatabaseQuery(
    () =>
      prisma.forumQuestion.findUnique({
        where: {
          id: questionId,
        },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          answers: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      }),
    {
      label: `forum-question-${questionId}`,
    },
  );
  const fallbackQuestion = dbQuestion ? null : getForumQuestionById(questionId);
  const question = dbQuestion ?? fallbackQuestion;

  if (!question) {
    notFound();
  }

  const answers = dbQuestion
    ? sortAnswersByAcceptanceAndScore(dbQuestion.answers).map((answer) => ({
        id: answer.id,
        body: answer.body,
        voteScore: answer.voteScore,
        isAccepted: answer.isAccepted,
        authorName: answer.author.name,
      }))
    : sortAnswersByAcceptanceAndScore(fallbackQuestion!.answers).map((answer) => ({
        id: answer.id,
        body: answer.body,
        voteScore: answer.voteScore,
        isAccepted: answer.isAccepted,
        authorName: answer.authorName,
      }));
  const statusMessage = getStatusMessage(status);
  const isOwner = Boolean(dbQuestion && session?.user?.id === dbQuestion.authorId);
  const questionAuthorName = dbQuestion
    ? dbQuestion.author.name
    : fallbackQuestion?.authorName ?? "Unknown author";
  const backHref = dbQuestion ? `/forum/${dbQuestion.category.slug}` : "/forum";
  const backLabel = dbQuestion ? `Back to ${dbQuestion.category.name}` : "Back to forum";
  const answerCount = dbQuestion ? dbQuestion.answerCount : fallbackQuestion!.answers.length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 lg:py-24">
      {statusMessage ? (
        <p className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm leading-7 text-cyan-100">
          {statusMessage}
        </p>
      ) : null}

      <section className="space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <Link href={backHref} className="text-sm text-cyan-200 hover:text-cyan-100">
          {backLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
            Question
          </span>
          {answers.some((answer) => answer.isAccepted) ? (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
              Solved
            </span>
          ) : null}
        </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            {question.title}
          </h1>
          <p className="text-lg leading-8 text-slate-300">{question.body}</p>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <span>Asked by {questionAuthorName}</span>
            <span>{question.viewCount} views</span>
            <span>{answerCount} answers</span>
          </div>
        </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        {session?.user && dbQuestion ? (
          <form action={createAnswerAction} className="space-y-4">
            <input type="hidden" name="questionId" value={dbQuestion.id} />
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Your answer</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Share the actual reasoning, not just the final recommendation.
              </p>
            </div>
            <textarea
              name="body"
              placeholder="Explain your reasoning, list tradeoffs, and mention any compatibility details that matter."
              className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
              required
            />
            <button
              type="submit"
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Post answer
            </button>
          </form>
        ) : session?.user ? (
          <div className="text-sm leading-7 text-slate-400">
            This question is currently being shown from fallback demo data. Run the Prisma migration and seed to enable posting here.
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Join the thread</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Log in to answer, vote, and mark the best reply as solved if you asked the question.
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
            >
              Log in
            </Link>
          </div>
        )}
      </section>

      <section className="space-y-4">
        {answers.map((answer) => (
          <article
            key={answer.id}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-8"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium text-white">
                    {answer.authorName}
                  </p>
                  {answer.isAccepted ? (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
                      Solved answer
                    </span>
                  ) : null}
                </div>
                <p className="text-base leading-8 text-slate-300">{answer.body}</p>
                <div className="flex flex-wrap gap-2">
                  {session?.user && dbQuestion ? (
                    <>
                      <form action={voteAnswerAction}>
                        <input type="hidden" name="questionId" value={dbQuestion.id} />
                        <input type="hidden" name="answerId" value={answer.id} />
                        <input type="hidden" name="value" value="1" />
                        <button
                          type="submit"
                          className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
                        >
                          Upvote
                        </button>
                      </form>
                      <form action={voteAnswerAction}>
                        <input type="hidden" name="questionId" value={dbQuestion.id} />
                        <input type="hidden" name="answerId" value={answer.id} />
                        <input type="hidden" name="value" value="-1" />
                        <button
                          type="submit"
                          className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
                        >
                          Downvote
                        </button>
                      </form>
                      {isOwner && !answer.isAccepted ? (
                        <form action={markSolvedAnswerAction}>
                          <input type="hidden" name="questionId" value={dbQuestion.id} />
                          <input type="hidden" name="answerId" value={answer.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-emerald-400/25 px-3 py-2 text-xs text-emerald-200 transition hover:border-emerald-300/40 hover:text-white"
                          >
                            Mark solved
                          </button>
                        </form>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Votes</p>
                <p className="mt-2 text-3xl font-semibold text-cyan-200">
                  {answer.voteScore}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
