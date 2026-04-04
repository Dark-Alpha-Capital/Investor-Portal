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
import { ModeToggle } from "@/components/mode-toggle";
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
      }
    );
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-end">
            <ModeToggle />
          </div>

          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto flex items-center justify-center">
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
            <p className="text-muted-foreground text-base">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-semibold text-foreground">{form.getValues("email")}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>
                Click the link in the email to reset your password. The link
                will expire in 1 hour.
              </p>
              <p className="text-xs">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
            </div>

            <Button
              variant="secondary"
              className="w-full h-11"
              onClick={() => setEmailSent(false)}
            >
              Send another email
            </Button>

            <Button
              variant="ghost"
              className="w-full h-11"
              asChild
            >
              <Link to="/login">Back to Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-end">
          <ModeToggle />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-muted-foreground text-base">
            Enter your email address and we&apos;ll send you a reset link
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
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
              className="w-full h-11"
              disabled={requestPasswordReset.isPending}
            >
              {requestPasswordReset.isPending
                ? "Sending..."
                : "Send reset link"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/(auth)/forgot-password/")({
  component: ForgotPasswordPage,
});
