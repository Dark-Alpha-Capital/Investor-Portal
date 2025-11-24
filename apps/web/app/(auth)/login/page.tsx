import React from "react";
import GoogleSignInButton from "@/components/google-sign-in-button";
import Link from "next/link";

const LoginPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Login</h1>
      <GoogleSignInButton />
      <p className="text-sm text-gray-500">
        Don't have an account? <Link href="/register">Register</Link>
      </p>
    </div>
  );
};

export default LoginPage;
