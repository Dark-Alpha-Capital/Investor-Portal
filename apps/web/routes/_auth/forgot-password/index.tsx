import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { useRequestPasswordReset } from "@/hooks/use-auth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordPage() {
  const requestPasswordReset = useRequestPasswordReset();
  const [emailSent, setEmailSent] = React.useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    requestPasswordReset.mutate(
      {
        email: data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      },
      {
        onSuccess: () => {
          setEmailSent(true);
        },
      },
    );
  };

  if (emailSent) {
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <AuthPageHeader
            title="Check your email"
            description={
              <>
                We&apos;ve sent a password reset link to{" "}
                <span className="font-semibold text-foreground">
                  {form.getValues("email")}
                </span>
              </>
            }
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2 text-center text-sm text-muted-foreground lg:text-left">
            <p>
              Click the link in the email to reset your password. The link will
              expire in 1 hour.
            </p>
            <p className="text-xs">
              Didn&apos;t receive the email? Check your spam folder or try
              again.
            </p>
          </div>

          <Button
            variant="secondary"
            className="h-11 w-full rounded-full"
            onClick={() => setEmailSent(false)}
          >
            Send another email
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
        title="Reset your password"
        description="Enter your email address and we'll send you a reset link"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    disabled={requestPasswordReset.isPending}
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
            disabled={requestPasswordReset.isPending}
          >
            {requestPasswordReset.isPending ? "Sending..." : "Send reset link"}
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

export const Route = createFileRoute("/_auth/forgot-password/")({
  component: ForgotPasswordPage,
});
