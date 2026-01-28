import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { AlertCircle, ShieldX } from "lucide-react";
import { authSession } from "@/app/(auth)/auth";
import { getOnboardingWithEditHistory } from "@repo/db/queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditOnboardingProfileClient } from "./EditOnboardingProfileClient";

function EditOnboardingProfileSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function EditOnboardingPage() {
  return (
    <Suspense fallback={<EditOnboardingProfileSkeleton />}>
      <EditOnboardingContentWrapper />
    </Suspense>
  );
}

async function EditOnboardingContentWrapper() {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  const isAdmin =
    session.user.role === "admin" ||
    session.user.email?.endsWith("@darkalphacapital.com");

  if (isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card className="text-center">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-muted">
                <ShieldX className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">
                Admin Access Restricted
              </CardTitle>
              <CardDescription className="mt-2">
                Administrators cannot edit onboarding information.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              As an administrator, you do not have access to the investor
              onboarding editing flow. Please use the admin dashboard to manage
              users and review onboarding submissions.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/admin">Go to Admin Dashboard</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userId = session.user.id;

  return <FetchEditOnboardingWrapper userId={userId} />;
}

async function FetchEditOnboardingWrapper({ userId }: { userId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`onboarding-edit-profile-${userId}`);

  const data = await getOnboardingWithEditHistory(userId);

  if (!data || !data.onboarding) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Onboarding Found</AlertTitle>
          <AlertDescription>
            You haven&apos;t completed the onboarding process yet.{" "}
            <Link href="/onboarding" className="text-primary underline">
              Start onboarding
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { onboarding, editHistory } = data;

  return (
    <EditOnboardingProfileClient
      onboarding={onboarding as any}
      editHistory={editHistory as any}
    />
  );
}
