import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FcGoogle } from "react-icons/fc";
import { AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { useSignInEmail, useGoogleAuth } from "@/hooks/use-auth";
import {
  getAuthErrorMessage,
  isEmailNotVerifiedError,
  isInvalidCredentialsError,
  SignInError,
} from "@/lib/auth/errors";
import { loginSchema, type LoginFormValues } from "@/lib/schemas/auth";

function LoginPage() {
  const signInEmail = useSignInEmail();
  const googleAuth = useGoogleAuth();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    form.clearErrors("root");

    try {
      await signInEmail.mutateAsync({
        email: data.email,
        password: data.password,
      });
    } catch (error) {
      const authError =
        error instanceof SignInError
          ? error
          : new SignInError({
              message:
                error instanceof Error ? error.message : "Failed to sign in",
            });

      // Unverified users are redirected by the hook; keep a form notice too.
      if (isEmailNotVerifiedError(authError)) {
        form.setError("root", {
          message: getAuthErrorMessage(authError),
        });
        return;
      }

      const message = getAuthErrorMessage(authError, "Failed to sign in");

      form.setError("root", { message });

      // Field-level hint for bad credentials (same copy for unknown email /
      // wrong password — Better Auth does not distinguish them on purpose).
      if (isInvalidCredentialsError(authError)) {
        form.setError("password", { message });
      }
    }
  };

  const handleGoogleSignIn = () => {
    googleAuth.mutate();
  };

  const isPending = googleAuth.isPending || signInEmail.isPending;
  const rootError = form.formState.errors.root?.message;

  return (
    <div className="space-y-8">
      <AuthPageHeader title="Login" />

      <div className="space-y-5">
        <Button
          variant="secondary"
          className="h-11 w-full rounded-full"
          onClick={handleGoogleSignIn}
          disabled={isPending}
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          {googleAuth.isPending ? "Signing in..." : "Continue with Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 font-medium text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {rootError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        ) : null}

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
                      autoComplete="email"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {signInEmail.isPending ? "Signing in..." : "Login"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_auth/login/")({
  component: LoginPage,
});
