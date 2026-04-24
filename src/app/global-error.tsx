"use client";

import { useEffect } from "react";
import { errorReporting } from "@/lib/error-reporting";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to our incident-friendly reporting tool
    errorReporting.captureException(error, { digest: error.digest, scope: "global-error" });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 p-4">
          <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
          <p className="mb-6 text-gray-600">A critical error occurred. Our team has been notified.</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
