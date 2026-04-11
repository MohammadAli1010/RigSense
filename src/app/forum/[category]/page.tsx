import Link from "next/link";
import { notFound } from "next/navigation";

import { createQuestionAction } from "@/actions/forum";
import { auth } from "@/auth";
import { getForumCategoryBySlug, getQuestionsByCategory } from "@/data/mock-data";
import { prisma } from "@/lib/db";

type ForumCategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

function getStatusMessage(status?: string) {
  switch (status) {
    case "question-invalid":
      return "Question title and body need a bit more detail before posting.";
    case "seed-forum-required":
      return "Forum categories are not seeded in the database yet.";
    default:
      return null;
  }
}

export default async function ForumCategoryPage({
  params,
  searchParams,
}: ForumCategoryPageProps) {
  const { category } = await params;
  const { status } = await searchParams;
  const session = await auth();
  const dbCategory = await prisma.forumCategory.findUnique({
    where: {
      slug: category,
    },
    include: {
      questions: {
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
      },
    },
  });
  const forumCategory = dbCategory ?? getForumCategoryBySlug(category);

  if (!forumCategory) {
    notFound();
  }

  const questions = dbCategory
    ? dbCategory.questions.map((question) => ({
        id: question.id,
        title: question.title,
        body: question.body,
        answerCount: question.answerCount,
        viewCount: question.viewCount,
        isSolved: Boolean(question.solvedAnswerId),
        authorName: question.author.name,
      }))
    : getQuestionsByCategory(category).map((question) => ({
        id: question.id,
        title: question.title,
        body: question.body,
        answerCount: question.answers.length,
        viewCount: question.viewCount,
        isSolved: question.answers.some((answer) => answer.isAccepted),
        authorName: question.authorName,
      }));
  const statusMessage = getStatusMessage(status);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 lg:py-24">
      {statusMessage ? (
        <p className="rounded-[2rem] border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm leading-7 text-amber-100">
          {statusMessage}
        </p>
      ) : null}

      <section className="max-w-3xl space-y-5">
        <Link href="/forum" className="text-sm text-cyan-200 hover:text-cyan-100">
          Back to forum
        </Link>
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
          Forum category
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {forumCategory.name}
        </h1>
        <p className="text-lg leading-8 text-slate-300">
          {forumCategory.description}
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        {session?.user && dbCategory ? (
          <form action={createQuestionAction} className="space-y-4">
            <input type="hidden" name="categorySlug" value={dbCategory.slug} />
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Ask a question</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Keep the title specific and include the details someone needs to answer well.
              </p>
            </div>
            <input
              name="title"
              placeholder="Example: Is this AM5 board overkill for a midrange gaming build?"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
              required
            />
            <textarea
              name="body"
              placeholder="Share your budget, current parts, target resolution, and any constraints."
              className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
              required
            />
            <button
              type="submit"
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Post question
            </button>
          </form>
        ) : session?.user ? (
          <div className="text-sm leading-7 text-slate-400">
            Seed the forum database content before posting new questions in this category.
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Want to ask?</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Sign in to post a question, answer threads, vote on replies, and mark a solved answer.
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
        {questions.map((question) => (
          <Link
            key={question.id}
            href={`/forum/questions/${question.id}`}
            className="block rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/40"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">{question.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{question.body}</p>
              </div>
              <div className="text-sm text-slate-400 lg:text-right">
                <p>{question.answerCount} answers</p>
                <p>{question.viewCount} views</p>
                <p>by {question.authorName}</p>
                <p>
                  {question.isSolved ? "Solved" : "Open"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
