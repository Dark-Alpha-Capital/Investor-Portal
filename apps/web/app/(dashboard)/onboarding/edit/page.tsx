"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { OnboardingFlow } from "../onboarding-flow";
import { OnboardingSkeleton } from "@/components/skeleton/onboarding-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

/**
 * Edit Onboarding Page
 *
 * This page allows users to edit their submitted onboarding data
 * using the same UI flow as the original submission.
 */
export default function EditOnboardingPage() {
  const trpc = useTRPC();

  const { data, isLoading, error } = useQuery(
    trpc.onboarding.getMyOnboarding.queryOptions()
  );

  if (isLoading) {
    return <OnboardingSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load your onboarding data. Please try again.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="secondary">
            <Link href="/onboarding">Back to Onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!data?.onboarding) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Onboarding Found</AlertTitle>
          <AlertDescription>
            You haven&apos;t completed the onboarding process yet.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link href="/onboarding">Start Onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if editing is disabled
  if (data.onboarding.isEditable === false) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Editing Disabled</AlertTitle>
          <AlertDescription>
            Your onboarding information can no longer be edited. Please contact
            support if you need to make changes.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="secondary">
            <Link href="/onboarding">Back to Onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <OnboardingFlow
      editMode={true}
      existingOnboarding={data.onboarding}
    />
  );
}
