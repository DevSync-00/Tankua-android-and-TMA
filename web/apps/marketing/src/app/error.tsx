"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@tankua/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f5f0] to-white flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center text-red-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold text-[#181714] mb-4">
          Something went wrong!
        </h1>
        <p className="text-lg text-[#181714]/70 mb-8">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>
        {error.message && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error.message}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} size="lg" variant="outline">
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          <Link href="/">
            <Button size="lg" className="bg-[#ffb800] hover:bg-[#d99c00]">
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
