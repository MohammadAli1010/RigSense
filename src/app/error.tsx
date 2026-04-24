"use client";

import { useEffect } from "react";
import { errorReporting } from "@/lib/error-reporting";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to our incident-friendly reporting tool
    errorReporting.captureException(error, { digest: error.digest, scope: "app-error" });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm border border-gray-100 max-w-lg mx-auto mt-12 text-center">
      <h2 className="text-xl font-bold mb-3 text-red-600">Something went wrong</h2>
      <p className="text-gray-600 mb-6">
        We encountered an error processing your request. The issue has been logged.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition"
      >
        Try again
      </button>
    </div>
  );
}
