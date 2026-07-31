import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/hooks/use-app-navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import {
  getAuthErrorMessage,
  isEmailNotVerifiedError,
  SignInError,
  type AuthClientError,
} from "@/lib/auth/errors";
import { getClientSession } from "@/lib/auth/get-client-session";
import { getAppHomePath } from "@/lib/auth/user-role-guards";
import type { LoginFormValues } from "@/lib/schemas/auth";

type SignInEmailInput = LoginFormValues;

const VERIFY_EMAIL_SUCCESS_URL = () =>
  `${window.location.origin}/verify-email?verified=true`;

type SignUpEmailInput = {
  name: string;
  email: string;
  password: string;
  callbackURL?: string;
};

type ResendVerificationEmailInput = {
  email: string;
  callbackURL?: string;
};

type RequestPasswordResetInput = {
  email: string;
  redirectTo?: string;
};

type ResetPasswordInput = {
  newPassword: string;
  token: string;
};

/**
 * Hook for email/password sign in.
 * Maps Better Auth error codes (INVALID_EMAIL_OR_PASSWORD, EMAIL_NOT_VERIFIED, …)
 * to user-facing messages without leaking whether an email is registered.
 */
export function useSignInEmail() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: SignInEmailInput) => {
      try {
        const result = await authClient.signIn.email({
          email: input.email,
          password: input.password,
        });

        if (result.error) {
          throw new SignInError(result.error as AuthClientError, {
            email: input.email,
          });
        }

        return result;
      } catch (error) {
        if (error instanceof SignInError) throw error;

        // Fallback when the Cloudflare Vite/miniflare bridge swallows the
        // auth JSON body (POST→401 "fetch failed" in older plugin versions).
        const message =
          error instanceof Error ? error.message : "Failed to sign in";
        const bridgeFailure = /fetch failed|failed to fetch/i.test(message);

        throw new SignInError(
          {
            code: bridgeFailure ? "INVALID_EMAIL_OR_PASSWORD" : undefined,
            message: bridgeFailure
              ? "Invalid email or password"
              : message,
            status: bridgeFailure ? 401 : undefined,
          },
          { email: input.email },
        );
      }
    },
    onSuccess: async () => {
      toast.success("Signed in successfully");
      const session = await getClientSession();
      const home = session?.user ? getAppHomePath(session.user) : "/dashboard";
      router.push(home);
      router.refresh();
    },
    onError: (error: unknown) => {
      const signInError =
        error instanceof SignInError
          ? error
          : new SignInError(
            {
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to sign in",
            },
            {
              email:
                typeof error === "object" &&
                  error &&
                  "email" in error &&
                  typeof error.email === "string"
                  ? error.email
                  : undefined,
            },
          );

      if (isEmailNotVerifiedError(signInError)) {
        toast.error(getAuthErrorMessage(signInError));
        const emailParam = signInError.email
          ? `&email=${encodeURIComponent(signInError.email)}`
          : "";
        router.push(`/verify-email?pending=true${emailParam}`);
        return;
      }

      toast.error(getAuthErrorMessage(signInError, "Failed to sign in"));
    },
  });
}

/**
 * Hook for email/password sign up
 */
export function useSignUpEmail() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: SignUpEmailInput) => {
      const result = await authClient.signUp.email({
        email: input.email,
        password: input.password,
        name: input.name,
        // After the email link verifies, Better Auth redirects here.
        callbackURL: input.callbackURL || VERIFY_EMAIL_SUCCESS_URL(),
      });

      if (result.error) {
        throw result.error;
      }

      return result;
    },
    onSuccess: (_, variables) => {
      toast.success(
        "Account created successfully! Please check your email to verify your account."
      );
      router.push(
        `/verify-email?pending=true&email=${encodeURIComponent(variables.email)}`
      );
      router.refresh();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create account");
    },
  });
}

/**
 * Hook for Google OAuth sign in/sign up
 */
export function useGoogleAuth() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      console.log("[Google Auth] Starting OAuth flow...");
      console.log(
        "[Google Auth] Base URL:",
        import.meta.env.VITE_PUBLIC_BETTER_AUTH_URL
      );

      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });

      console.log("[Google Auth] Result:", result);

      if (result.error) {
        throw result.error;
      }

      return result;
    },
    onSuccess: async () => {
      const session = await getClientSession();
      const home = session?.user ? getAppHomePath(session.user) : "/dashboard";
      router.push(home);
      router.refresh();
    },
    onError: (error: { message?: string }) => {
      console.error("[Google Auth] Error:", error);
      toast.error(error.message || "Failed to sign in with Google");
    },
  });
}

/**
 * Hook for resending verification email (client-side)
 */
export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: async (input: ResendVerificationEmailInput) => {
      const result = await authClient.sendVerificationEmail({
        email: input.email,
        callbackURL: input.callbackURL || VERIFY_EMAIL_SUCCESS_URL(),
      });

      if (result.error) {
        throw result.error;
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Verification email sent! Please check your inbox.");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to send verification email");
    },
  });
}

/**
 * Hook for requesting password reset
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (input: RequestPasswordResetInput) => {
      const result = await authClient.requestPasswordReset({
        email: input.email,
        redirectTo:
          input.redirectTo || `${window.location.origin}/reset-password`,
      });

      if (result.error) {
        throw result.error;
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Password reset email sent! Please check your inbox.");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to send password reset email");
    },
  });
}

/**
 * Hook for resetting password with token
 */
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: ResetPasswordInput) => {
      const result = await authClient.resetPassword({
        newPassword: input.newPassword,
        token: input.token,
      });

      if (result.error) {
        throw result.error;
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Password reset successfully! You can now sign in.");
      router.push("/login");
    },
    onError: (error: { message?: string }) => {
      if (
        error.message?.includes("INVALID_TOKEN") ||
        error.message?.includes("expired")
      ) {
        toast.error(
          "The reset link is invalid or has expired. Please request a new one."
        );
      } else {
        toast.error(error.message || "Failed to reset password");
      }
    },
  });
}
