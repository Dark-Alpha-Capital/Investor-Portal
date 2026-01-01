"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-6">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold mb-3">Authentication Error</h1>

          <p className="text-muted-foreground mb-6">
            We encountered a problem while processing your request. Please try
            again.
          </p>

          {error.digest && (
            <p className="text-xs text-muted-foreground mb-6">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3">
            <Button onClick={reset} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Site
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
