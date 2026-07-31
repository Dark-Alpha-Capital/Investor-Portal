
import { useEffect } from "react";
import { AppLink as Link } from "@/components/app-link";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <section>
        <div className="text-center">
          <div className="mx-auto rounded-full bg-destructive/10 p-4 mb-4 w-fit">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-2xl">Something went wrong</h3>
          <p>
            An error occurred while loading this page. Please try again or
            contact support if the problem persists.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3">
            <Button onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>Need help?</p>
            <Link
              href="mailto:support@darkalphacapital.com"
              className="text-primary hover:underline"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
