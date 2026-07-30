import React, { useEffect, useState, Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { useResetPassword } from "@/hooks/use-auth";

export const Route = createFileRoute("/(auth)/reset-password/")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: ResetPasswordPage,
});

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

function ResetPasswordContent() {
  const { token, error: searchError } = Route.useSearch();
  const resetPassword = useResetPassword();
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (searchError === "INVALID_TOKEN") {
      setStatus("error");
      setErrorMessage(
        "The reset link is invalid or has expired. Please request a new password reset.",
      );
    } else if (!token) {
      setStatus("error");
      setErrorMessage(
        "No reset token provided. Please use the link from your email.",
      );
    }
  }, [searchError, token]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setStatus("error");
      setErrorMessage(
        "No reset token provided. Please use the link from your email.",
      );
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
        onError: (err: { message?: string }) => {
          setStatus("error");
          if (
            err.message?.includes("INVALID_TOKEN") ||
            err.message?.includes("expired")
          ) {
            setErrorMessage(
              "The reset link is invalid or has expired. Please request a new password reset.",
            );
          } else {
            setErrorMessage(err.message || "Failed to reset password");
          }
        },
      },
    );
  };

  if (status === "success") {
    return (
      <div className="space-y-8">
        <div className="space-y-4 text-center lg:text-left">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted lg:mx-0">
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
          <AuthPageHeader
            title="Password reset successful"
            description="Your password has been reset successfully. You can now sign in with your new password."
          />
        </div>

        <Button className="w-full" asChild>
          <Link to="/login">Continue to Sign In</Link>
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-8">
        <div className="space-y-4 text-center lg:text-left">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 lg:mx-0">
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
          <AuthPageHeader title="Reset failed" description={errorMessage} />
        </div>

        <div className="space-y-3">
          <Button variant="secondary" className="h-11 w-full rounded-full" asChild>
            <Link to="/forgot-password">Request New Reset Link</Link>
          </Button>
          <Button variant="ghost" className="h-11 w-full" asChild>
            <Link to="/login">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AuthPageHeader
        title="Create new password"
        description="Enter your new password below. Make sure it's at least 8 characters long."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

      <div className="text-center text-sm text-muted-foreground lg:text-left">
        Remember your password?{" "}
        <Link
          to="/login"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
