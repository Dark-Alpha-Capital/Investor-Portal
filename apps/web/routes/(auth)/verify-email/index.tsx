import React, { useEffect, useState, Suspense } from "react";
import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useResendVerificationEmail } from "@/hooks/use-auth";

export const Route = createFileRoute("/(auth)/verify-email/")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
    token: typeof search.token === "string" ? search.token : undefined,
    pending: typeof search.pending === "string" ? search.pending : undefined,
  }),
  component: VerifyEmailPage,
});

function VerifyEmailContent() {
  const { email, error, token, pending } = Route.useSearch();
  const navigate = useNavigate();
  const resendEmail = useResendVerificationEmail();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (pending === "true") {
      setStatus("loading");
      setMessage(
        "We've sent a verification email to your inbox. Please click the link in the email to verify your account."
      );
    } else if (error === "invalid_token") {
      setStatus("error");
      setMessage(
        "The verification link is invalid or has expired. Please request a new verification email."
      );
    } else if (token) {
      setStatus("success");
      setMessage("Your email has been verified successfully!");
    } else {
      setStatus("success");
      setMessage("Your email has been verified successfully!");
    }
  }, [email, error, token, pending]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-end">
          <ModeToggle />
        </div>

        <div className="space-y-4 text-center">
          <div className="w-16 h-16 mx-auto flex items-center justify-center">
            {status === "success" ? (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            ) : status === "error" ? (
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {status === "success"
              ? "Email Verified!"
              : status === "error"
                ? "Verification Failed"
                : "Verifying Email..."}
          </h1>
          <p className="text-muted-foreground text-base">{message}</p>
        </div>

        <div className="space-y-3">
          {status === "success" && (
            <>
              <Button
                className="w-full h-11"
                onClick={() => navigate({ to: "/login" })}
              >
                Continue to Sign In
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Your email has been verified. You can now sign in to your
                account.
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <Button
                variant="secondary"
                className="w-full h-11"
                onClick={() => {
                  if (email) {
                    resendEmail.mutate(
                      {
                        email,
                        callbackURL: `${window.location.origin}/verify-email`,
                      },
                      {
                        onSuccess: () => {
                          setMessage(
                            "A new verification email has been sent. Please check your inbox."
                          );
                          setStatus("loading");
                        },
                        onError: () => {
                          setMessage(
                            "Failed to send verification email. Please try again later."
                          );
                        },
                      }
                    );
                  }
                }}
                disabled={resendEmail.isPending || !email}
              >
                {resendEmail.isPending
                  ? "Sending..."
                  : "Resend Verification Email"}
              </Button>
              <Button
                variant="ghost"
                className="w-full h-11"
                onClick={() => navigate({ to: "/login" })}
              >
                Back to Sign In
              </Button>
            </>
          )}

          {status === "loading" && (
            <>
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>{message}</p>
                <p className="text-xs">
                  Didn&apos;t receive the email? Check your spam folder or request
                  a new verification email.
                </p>
              </div>
              <Button
                variant="secondary"
                className="w-full h-11"
                disabled={resendEmail.isPending || !email}
                onClick={() => {
                  if (email) {
                    resendEmail.mutate({
                      email,
                      callbackURL: `${window.location.origin}/verify-email`,
                    });
                  }
                }}
              >
                {resendEmail.isPending
                  ? "Sending..."
                  : "Resend Verification Email"}
              </Button>
              <Button
                variant="ghost"
                className="w-full h-11"
                onClick={() => navigate({ to: "/login" })}
              >
                Back to Sign In
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
