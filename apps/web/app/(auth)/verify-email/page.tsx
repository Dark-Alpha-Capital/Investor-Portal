"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

// Mark page as dynamic to prevent static generation
export const dynamic = "force-dynamic";

const VerifyEmailContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const error = searchParams.get("error");
    const token = searchParams.get("token");
    const pending = searchParams.get("pending");

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
      // Token is present, verification was successful
      setStatus("success");
      setMessage("Your email has been verified successfully!");
    } else {
      // No error or token, assume success (Better Auth handles verification automatically)
      setStatus("success");
      setMessage("Your email has been verified successfully!");
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen">
      {/* Left Column - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-12">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              {status === "success" ? (
                <svg
                  className="w-12 h-12 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : status === "error" ? (
                <svg
                  className="w-12 h-12 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-12 h-12 text-primary animate-spin"
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
              )}
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              {status === "success"
                ? "Email Verified"
                : status === "error"
                  ? "Verification Failed"
                  : "Verifying..."}
            </h2>
            <p className="text-muted-foreground text-lg">{message}</p>
          </div>
        </div>
      </div>

      {/* Right Column - Content */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1 text-center">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              {status === "success" ? (
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
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
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-600 dark:text-red-400"
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
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
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
            <h2 className="text-2xl font-bold">
              {status === "success"
                ? "Email Verified!"
                : status === "error"
                  ? "Verification Failed"
                  : "Verifying Email..."}
            </h2>
            <p className="text-muted-foreground mt-2">{message}</p>
          </div>

          <div className="space-y-4">
            {status === "success" && (
              <>
                <Button
                  className="w-full"
                  onClick={() => router.push("/login")}
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
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    const email = searchParams.get("email");
                    if (email) {
                      try {
                        await authClient.sendVerificationEmail({
                          email,
                          callbackURL: `${window.location.origin}/verify-email`,
                        });
                        setMessage(
                          "A new verification email has been sent. Please check your inbox."
                        );
                        setStatus("success");
                      } catch (error) {
                        setMessage(
                          "Failed to send verification email. Please try again later."
                        );
                      }
                    }
                  }}
                >
                  Resend Verification Email
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push("/login")}
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
                    Didn't receive the email? Check your spam folder or request
                    a new verification email.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!searchParams.get("email")}
                  onClick={async () => {
                    const email = searchParams.get("email");
                    if (email) {
                      try {
                        await authClient.sendVerificationEmail({
                          email,
                          callbackURL: `${window.location.origin}/verify-email`,
                        });
                        toast.success(
                          "Verification email sent! Please check your inbox."
                        );
                      } catch (error) {
                        toast.error(
                          "Failed to send verification email. Please try again later."
                        );
                      }
                    }
                  }}
                >
                  Resend Verification Email
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push("/login")}
                >
                  Back to Sign In
                </Button>
              </>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const VerifyEmailPage = () => {
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
};

export default VerifyEmailPage;
