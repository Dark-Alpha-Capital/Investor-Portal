"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FcGoogle } from "react-icons/fc";
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
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const router = useRouter();
  const [isLoading, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange", // Validate on change for better UX
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    startTransition(async () => {
      try {
        const result = await authClient.signUp.email({
          email: data.email,
          password: data.password,
          name: data.name,
          callbackURL: `${window.location.origin}/verify-email`,
        });

        if (result.error) {
          toast.error(result.error.message || "Failed to create account");
          return;
        }

        toast.success(
          "Account created successfully! Please check your email to verify your account."
        );
        // Redirect to a page that shows verification instructions
        router.push(
          `/verify-email?pending=true&email=${encodeURIComponent(data.email)}`
        );
        router.refresh();
      } catch (error) {
        toast.error("An unexpected error occurred");
      }
    });
  };

  const handleGoogleSignUp = async () => {
    try {
      const data = await authClient.signIn.social({
        provider: "google",
      });

      if (data.error) {
        toast.error(data.error.message || "Failed to sign up with Google");
        return;
      }

      toast.success("Account created successfully");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };
  return (
    <div className="flex h-screen">
      {/* Left Column - Image */}
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Join us today
            </h2>
            <p className="text-muted-foreground text-lg">
              Create your account and start your investment journey with us
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <ModeToggle />

          <div className="space-y-1 text-center">
            <h2 className="text-2xl font-bold">Create an account</h2>
            <p className="text-muted-foreground">
              Enter your information to get started
            </p>
          </div>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading || isLoading}
            >
              <FcGoogle className="mr-2 h-4 w-4" />
              {isGoogleLoading ? "Signing up..." : "Continue with Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="John Doe"
                          disabled={isLoading || isGoogleLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          disabled={isLoading || isGoogleLoading}
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create a password"
                          disabled={isLoading || isGoogleLoading}
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
                        <Input
                          type="password"
                          placeholder="Confirm your password"
                          disabled={isLoading || isGoogleLoading}
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
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </Form>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
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
    </div>
  );
};

export default RegisterPage;
