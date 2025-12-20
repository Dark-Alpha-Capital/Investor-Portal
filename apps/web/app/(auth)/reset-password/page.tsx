"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ModeToggle } from "@/components/mode-toggle";
import { useResetPassword } from "@/hooks/use-auth";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resetPassword = useResetPassword();
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");

  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (error === "INVALID_TOKEN") {
      setStatus("error");
      setErrorMessage(
        "The reset link is invalid or has expired. Please request a new password reset."
      );
    } else if (!token) {
      setStatus("error");
      setErrorMessage("No reset token provided. Please use the link from your email.");
    }
  }, [error, token]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No reset token provided. Please use the link from your email.");
      return;
    }

    resetPassword.mutate(
      {
        newPassword: data.password,
        token,
      },
      {
        onSuccess: () => {
          setStatus("success");
        },
        onError: (error: { message?: string }) => {
          setStatus("error");
          if (error.message?.includes("INVALID_TOKEN") || error.message?.includes("expired")) {
            setErrorMessage(
              "The reset link is invalid or has expired. Please request a new password reset."
            );
          } else {
            setErrorMessage(error.message || "Failed to reset password");
          }
        },
      }
    );
  };

  if (status === "success") {
    return (
      <div className="flex h-screen">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-12">
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
              <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
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
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                Password Reset Successful
              </h2>
              <p className="text-muted-foreground text-lg">
                Your password has been reset successfully. You can now sign in
                with your new password.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md space-y-6">
            <ModeToggle />

            <div className="space-y-1 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
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
              </div>
              <h2 className="text-2xl font-bold">Password Reset Successful!</h2>
              <p className="text-muted-foreground mt-2">
                Your password has been reset successfully. You can now sign in
                with your new password.
              </p>
            </div>

            <div className="space-y-4">
              <Button className="w-full" asChild>
                <Link href="/login">Continue to Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-screen">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-12">
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
              <div className="w-24 h-24 mx-auto bg-destructive/20 rounded-full flex items-center justify-center">
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
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                Reset Failed
              </h2>
              <p className="text-muted-foreground text-lg">{errorMessage}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md space-y-6">
            <ModeToggle />

            <div className="space-y-1 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
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
              </div>
              <h2 className="text-2xl font-bold">Reset Failed</h2>
              <p className="text-muted-foreground mt-2">{errorMessage}</p>
            </div>

            <div className="space-y-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/forgot-password">Request New Reset Link</Link>
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/login">Back to Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-12">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Reset your password
            </h2>
            <p className="text-muted-foreground text-lg">
              Enter your new password below. Make sure it's at least 8
              characters long.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <ModeToggle />

          <div className="space-y-1 text-center">
            <h2 className="text-2xl font-bold">Create new password</h2>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Enter new password"
                        disabled={resetPassword.isPending}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          // Re-validate confirmPassword when password changes
                          if (form.getValues("confirmPassword")) {
                            form.trigger("confirmPassword");
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Confirm new password"
                        disabled={resetPassword.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={resetPassword.isPending || !token}
              >
                {resetPassword.isPending ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
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
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;

