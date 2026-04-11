import Link from "next/link";

import { auth } from "@/auth";
import { forumCategories, getRecentQuestions } from "@/data/mock-data";
import { prisma } from "@/lib/db";

export default async function ForumPage() {
  const session = await auth();
  const categories = await prisma.forumCategory.findMany({
    orderBy: {
      name: "asc",
    },
  });
  const recentQuestions = await prisma.forumQuestion.findMany({
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
    take: 6,
  });

  const categoryList = categories.length > 0 ? categories : forumCategories;
  const questionList =
    recentQuestions.length > 0
      ? recentQuestions.map((question) => ({
          id: question.id,
          title: question.title,
          body: question.body,
          answerCount: question.answerCount,
          viewCount: question.viewCount,
          authorName: question.author.name,
        }))
      : getRecentQuestions().map((question) => ({
          id: question.id,
          title: question.title,
          body: question.body,
          answerCount: question.answers.length,
          viewCount: question.viewCount,
          authorName: question.authorName,
        }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 lg:py-24">
      <section className="max-w-3xl space-y-5">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
          Forum
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Public Q&A with solved answers and ranked responses.
        </h1>
        <p className="text-lg leading-8 text-slate-300">
          The forum is readable without login. Authenticated users will ask questions,
          answer them, vote on the most useful replies, and mark a single answer as solved.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {categoryList.map((category) => (
          <Link
            key={category.slug}
            href={`/forum/${category.slug}`}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/40"
          >
            <h2 className="text-2xl font-semibold text-white">{category.name}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              {category.description}
            </p>
          </Link>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Recent questions</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Current Q&A threads</h2>
          </div>
          <Link
            href={session?.user ? "/profile" : "/login"}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
          >
            {session?.user ? "Open your account" : "Log in to answer"}
          </Link>
        </div>

        <div className="space-y-4">
          {questionList.map((question) => (
            <Link
              key={question.id}
              href={`/forum/questions/${question.id}`}
              className="block rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/40"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{question.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{question.body}</p>
                </div>
                <div className="text-sm text-slate-400 lg:text-right">
                  <p>{question.answerCount} answers</p>
                  <p>{question.viewCount} views</p>
                  <p>by {question.authorName}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
