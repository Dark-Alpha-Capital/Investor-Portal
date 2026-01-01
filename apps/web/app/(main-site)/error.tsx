"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MainSiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Main site error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>

        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>

        <p className="text-muted-foreground mb-8 max-w-md">
          We apologize for the inconvenience. An unexpected error has occurred.
          Please try again or return to the homepage.
        </p>

        {error.digest && (
          <p className="text-sm text-muted-foreground mb-6">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-4">
          <Button onClick={reset} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
