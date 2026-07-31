import { useEffect } from "react";
import { AppLink as Link } from "@/components/app-link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthPageHeader } from "@/components/auth/auth-page-header";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center space-y-4 text-center lg:items-start lg:text-left">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        <AuthPageHeader
          title="Authentication error"
          description="We encountered a problem while processing your request. Please try again."
        />

        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex w-full gap-3">
        <Button onClick={reset} className="h-11 flex-1 rounded-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button variant="secondary" className="h-11 flex-1 rounded-full" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Site
          </Link>
        </Button>
      </div>
    </div>
  );
}
