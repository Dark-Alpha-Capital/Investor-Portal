"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

type SignInEmailInput = {
  email: string;
  password: string;
};

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
 * Hook for email/password sign in
 */
export function useSignInEmail() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: SignInEmailInput) => {
      const result = await authClient.signIn.email({
        email: input.email,
        password: input.password,
      });

      if (result.error) {
        // Include email in error for redirect purposes
        throw { ...result.error, email: input.email };
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Signed in successfully");
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error: { status?: number; message?: string; email?: string }) => {
      if (error.status === 403) {
        toast.error("Please verify your email address before signing in.");
        const emailParam = error.email
          ? `&email=${encodeURIComponent(error.email)}`
          : "";
        router.push(`/verify-email?pending=true${emailParam}`);
      } else {
        toast.error(error.message || "Failed to sign in");
      }
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
        callbackURL:
          input.callbackURL || `${window.location.origin}/verify-email`,
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
      const result = await authClient.signIn.social({
        provider: "google",
      });

      if (result.error) {
        throw result.error;
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Signed in successfully");
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error: { message?: string }) => {
      console.log("error", error)

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
        callbackURL:
          input.callbackURL || `${window.location.origin}/verify-email`,
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
