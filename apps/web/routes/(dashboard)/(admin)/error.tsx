
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <section className="border-destructive/50">
        <div className="text-center">
          <div className="mx-auto rounded-full bg-destructive/10 p-4 mb-4 w-fit">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">
              Admin Area
            </span>
          </div>
          <h3 className="text-2xl">Admin Error</h3>
          <p>
            An error occurred in the admin panel. This has been logged for
            review.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          {error.digest && (
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {error.digest}
            </code>
          )}

          <div className="flex gap-3">
            <Button onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Admin Home
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
