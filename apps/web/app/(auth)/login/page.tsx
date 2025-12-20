"use client";

import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FcGoogle } from "react-icons/fc";
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
import { useSignInEmail, useGoogleAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
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
    signInEmail.mutate({
      email: data.email,
      password: data.password,
    });
  };

  const handleGoogleSignIn = () => {
    googleAuth.mutate();
  };

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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-lg">
              Sign in to access your investor portal and manage your investments
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <ModeToggle />

          <div className="space-y-1 text-center">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={googleAuth.isPending || signInEmail.isPending}
            >
              <FcGoogle className="mr-2 h-4 w-4" />
              {googleAuth.isPending ? "Signing in..." : "Continue with Google"}
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          disabled={
                            signInEmail.isPending || googleAuth.isPending
                          }
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
                          href="/forgot-password"
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <PasswordInput
                          placeholder="Enter your password"
                          disabled={
                            signInEmail.isPending || googleAuth.isPending
                          }
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
                  disabled={signInEmail.isPending || googleAuth.isPending}
                >
                  {signInEmail.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
