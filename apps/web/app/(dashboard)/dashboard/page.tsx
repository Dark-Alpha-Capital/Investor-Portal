import React from "react";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { getUserWithKycStatus } from "@repo/db/queries";
import { KycReviewScreen } from "./components/kyc-review";
import { KycPendingDocsScreen } from "./components/kyc-pending-docs";
import { KycRejectedScreen } from "./components/kyc-rejected";
import { DashboardMain } from "./components/dashboard-main";

const DashboardPage = async () => {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  const userData = await getUserWithKycStatus(session.user.id);

  if (!userData) {
    redirect("/login");
  }

  // If user hasn't completed onboarding, redirect to onboarding
  if (!userData.isOnboardingCompleted) {
    redirect("/onboarding");
  }

  console.log(userData);

  // Render different screens based on KYC status
  // Ensure kycStatus is properly typed and handled
  const kycStatus = userData.kycStatus;
  switch (kycStatus) {
    case "review":
      return <KycReviewScreen />;
    case "pending_docs":
      return <KycPendingDocsScreen />;
    case "rejected":
      return <KycRejectedScreen />;
    case "approved":
      return <DashboardMain />;
    default:
      // Default to review screen if status is unknown or null
      return <KycReviewScreen />;
  }
};

export default DashboardPage;
