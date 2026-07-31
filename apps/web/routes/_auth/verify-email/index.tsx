import React, { useEffect, useState, Suspense } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { useResendVerificationEmail } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth/client";

/** Only treat explicit truthy values as true — never serialize `false` into the URL. */
function parseTruthyFlag(value: unknown): true | undefined {
  if (value === true || value === "true" || value === "1") return true;
  return undefined;
}

const VERIFY_EMAIL_SUCCESS_PATH = "/verify-email?verified=true";

function errorMessageForCode(error: string | undefined): string {
  switch (error) {
    case "token_expired":
      return "The verification link has expired. Please request a new verification email.";
    case "invalid_token":
      return "The verification link is invalid. Please request a new verification email.";
    case "user_not_found":
      return "We couldn't find an account for this verification link.";
    case "unauthorized":
      return "You are not authorized to complete this verification.";
    default:
      return error
        ? "Email verification failed. Please request a new verification email."
        : "";
  }
}

export const Route = createFileRoute("/_auth/verify-email/")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
    token: typeof search.token === "string" ? search.token : undefined,
    pending: parseTruthyFlag(search.pending),
    verified: parseTruthyFlag(search.verified),
  }),
  component: VerifyEmailPage,
});

type VerifyStatus = "pending" | "success" | "error" | "verifying";

function resolveStatus(args: {
  pending?: true;
  verified?: true;
  error?: string;
  token?: string;
}): VerifyStatus {
  if (args.error) return "error";
  if (args.verified) return "success";
  if (args.token) return "verifying";
  if (args.pending) return "pending";
  return "pending";
}

function VerifyEmailContent() {
  const { email, error, token, pending, verified } = Route.useSearch();
  const navigate = useNavigate();
  const resendEmail = useResendVerificationEmail();
  const [status, setStatus] = useState<VerifyStatus>(() =>
    resolveStatus({ pending, verified, error, token }),
  );
  const [message, setMessage] = useState(() => {
    if (error) return errorMessageForCode(error);
    if (verified) return "Your email has been verified successfully!";
    if (token) return "Verifying your email…";
    if (pending) {
      return "We've sent a verification email to your inbox. Please click the link in the email to verify your account.";
    }
    return "Check your inbox for a verification link to activate your account.";
  });

  // If Better Auth sent the user to this page with a token (instead of hitting
  // /api/auth/verify-email), complete verification client-side then show success.
  useEffect(() => {
    if (!token || verified || error) return;

    let cancelled = false;
    setStatus("verifying");
    setMessage("Verifying your email…");

    const callbackURL = `${window.location.origin}${VERIFY_EMAIL_SUCCESS_PATH}`;
    const verifyUrl = `/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent(callbackURL)}`;

    void fetch(verifyUrl, { method: "GET", redirect: "manual" })
      .then((response) => {
        if (cancelled) return;

        // Successful verification redirects to callbackURL (3xx) or returns JSON.
        if (
          response.status >= 300 &&
          response.status < 400 &&
          response.headers.get("Location")
        ) {
          const location = response.headers.get("Location")!;
          window.location.assign(location);
          return;
        }

        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
          void navigate({
            to: "/verify-email",
            search: {
              email: undefined,
              error: undefined,
              token: undefined,
              pending: undefined,
              verified: true,
            },
            replace: true,
          });
          return;
        }

        setStatus("error");
        setMessage(errorMessageForCode("invalid_token"));
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setMessage(errorMessageForCode("invalid_token"));
      });

    return () => {
      cancelled = true;
    };
  }, [token, verified, error, navigate]);

  useEffect(() => {
    if (token && !verified && !error) return;

    if (error) {
      setStatus("error");
      setMessage(errorMessageForCode(error));
      return;
    }

    if (verified) {
      setStatus("success");
      setMessage("Your email has been verified successfully!");
      return;
    }

    if (pending) {
      setStatus("pending");
      setMessage(
        "We've sent a verification email to your inbox. Please click the link in the email to verify your account.",
      );
      return;
    }

    // Post-verify redirects used to land on bare /verify-email (no flags).
    // If the session is already verified, show success instead of inbox copy.
    let cancelled = false;
    void authClient.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data?.user?.emailVerified) {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
        void navigate({
          to: "/verify-email",
          search: {
            email: undefined,
            error: undefined,
            token: undefined,
            pending: undefined,
            verified: true,
          },
          replace: true,
        });
        return;
      }
      setStatus("pending");
      setMessage(
        "Check your inbox for a verification link to activate your account.",
      );
    });

    return () => {
      cancelled = true;
    };
  }, [email, error, token, pending, verified, navigate]);

  const title =
    status === "success"
      ? "Email verified"
      : status === "error"
        ? "Verification failed"
        : status === "verifying"
          ? "Verifying email"
          : "Check your inbox";

  const showInboxActions = status === "pending" || status === "error";

  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center lg:text-left">
        <div className="mx-auto flex h-16 w-16 items-center justify-center lg:mx-0">
          {status === "success" ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-8 w-8 text-primary"
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <svg
                className="h-8 w-8 text-destructive"
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
          ) : status === "verifying" ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-8 w-8 animate-spin text-primary"
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
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>
        <AuthPageHeader title={title} description={message} />
        {status === "pending" && email ? (
          <p className="text-sm text-muted-foreground">
            Sent to <span className="font-medium text-foreground">{email}</span>
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {status === "success" && (
          <>
            <Button
              className="w-full"
              onClick={() => navigate({ to: "/login" })}
            >
              Continue to Sign In
            </Button>
            <div className="text-center text-sm text-muted-foreground lg:text-left">
              Your email has been verified. You can now sign in to your account.
            </div>
          </>
        )}

        {showInboxActions && (
          <>
            {status === "pending" ? (
              <div className="space-y-2 text-center text-sm text-muted-foreground lg:text-left">
                <p className="text-xs">
                  Didn&apos;t receive the email? Check your spam folder or
                  request a new verification email.
                </p>
              </div>
            ) : null}
            <Button
              variant="secondary"
              className="h-11 w-full rounded-full"
              disabled={resendEmail.isPending || !email}
              onClick={() => {
                if (!email) return;
                resendEmail.mutate(
                  {
                    email,
                    callbackURL: `${window.location.origin}${VERIFY_EMAIL_SUCCESS_PATH}`,
                  },
                  {
                    onSuccess: () => {
                      setStatus("pending");
                      setMessage(
                        "A new verification email has been sent. Please check your inbox.",
                      );
                    },
                    onError: () => {
                      setStatus("error");
                      setMessage(
                        "Failed to send verification email. Please try again later.",
                      );
                    },
                  },
                );
              }}
            >
              {resendEmail.isPending
                ? "Sending..."
                : "Resend Verification Email"}
            </Button>
            <Button
              variant="ghost"
              className="h-11 w-full"
              onClick={() => navigate({ to: "/login" })}
            >
              Back to Sign In
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <svg
              className="h-8 w-8 animate-spin text-primary"
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
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
