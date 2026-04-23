import { dismissReportAction, resolveReportAction } from "@/actions/moderation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import Link from "next/link";

export default async function ModerationPage() {
  await requireRole(["MODERATOR", "ADMIN"]);

  const pendingReports = await prisma.report.findMany({
    where: { status: "PENDING" },
    include: {
      reporter: true,
      question: { include: { author: true } },
      answer: { include: { author: true, question: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Moderation Queue</h1>

      {pendingReports.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-slate-500">
          No pending reports in the queue.
        </div>
      ) : (
        <div className="space-y-6">
          {pendingReports.map((report) => {
            const targetType = report.questionId ? "Question" : "Answer";
            const targetAuthor = report.question?.author || report.answer?.author;
            const targetContent = report.question?.body || report.answer?.body;
            const linkHref = report.questionId
              ? `/forum/questions/${report.questionId}`
              : report.answer?.questionId
              ? `/forum/questions/${report.answer.questionId}#answer-${report.answerId}`
              : "#";

            return (
              <div key={report.id} className="bg-white p-6 rounded-lg shadow border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded mb-2">
                      Reported {targetType}
                    </span>
                    <h3 className="text-lg font-medium text-slate-900">
                      Reason: <span className="font-normal">{report.reason}</span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Reported by {report.reporter.name} • {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Link href={linkHref} target="_blank" className="text-blue-600 hover:underline text-sm font-medium">
                    View in context &rarr;
                  </Link>
                </div>

                <div className="bg-slate-50 p-4 rounded text-sm text-slate-700 mb-6 border border-slate-100">
                  <p className="font-semibold text-slate-900 mb-2">
                    Author: {targetAuthor?.name || "Unknown"}
                  </p>
                  <p className="whitespace-pre-wrap">{targetContent}</p>
                </div>

                <div className="flex items-center gap-4">
                  <form action={resolveReportAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="hideContent" value="true" />
                    <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors">
                      Hide Content &amp; Resolve
                    </button>
                  </form>
                  
                  <form action={resolveReportAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="hideContent" value="false" />
                    <button className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 font-medium transition-colors">
                      Resolve (Keep Content)
                    </button>
                  </form>

                  <form action={dismissReportAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <button className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium transition-colors">
                      Dismiss Report
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
