import React from "react";
import { OnboardingFlow } from "./onboarding-flow";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { isUserOnboarded } from "@repo/db/queries";
import Link from "next/link";

const OnboardingPage = async () => {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "admin") {
    return (
      <div>
        <div>
          <h1>Admins cannot access the onboarding page</h1>
          <p>Please contact support if you believe this is an error.</p>
        </div>
        <Link href="/admin">Go to Admin Dashboard</Link>
        <Link href="/dashboard">Go to Dashboard</Link>
      </div>
    );
  }

  const isOnboarded = await isUserOnboarded(session.user.id);
  if (isOnboarded) {
    return (
      <div>
        <div>
          <h1>You are already onboarded</h1>
          <p>Please go to your dashboard to view your profile.</p>
          <Link href="/dashboard">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return <OnboardingFlow />;
};

export default OnboardingPage;
