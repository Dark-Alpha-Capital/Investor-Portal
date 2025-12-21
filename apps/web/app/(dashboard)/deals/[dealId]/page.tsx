import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DealHeaderServer } from "./components/deal-header-server";
import { UserStatusCardServer } from "./components/user-status-card-server";
import { DealActionsServer } from "./components/deal-actions-server";
import { DealInformationServer } from "./components/deal-information-server";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, User, Info } from "lucide-react";

type PageProps = {
  params: Promise<{
    dealId: string;
  }>;
};

const LoadingFallback = ({ message }: { message: string }) => (
  <Card>
    <CardContent className="py-12">
      <div className="flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{message}</div>
      </div>
    </CardContent>
  </Card>
);

// Tab content components - Suspense is handled at the TabsContent level
async function OverviewTabContent({ dealId }: { dealId: string }) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingFallback message="Loading deal header..." />}>
        <DealHeaderServer dealId={dealId} />
      </Suspense>

      <Suspense fallback={<LoadingFallback message="Loading your status..." />}>
        <UserStatusCardServer dealId={dealId} />
      </Suspense>
    </div>
  );
}

async function ActionsTabContent({ dealId }: { dealId: string }) {
  return <DealActionsServer dealId={dealId} />;
}

async function InformationTabContent({ dealId }: { dealId: string }) {
  return <DealInformationServer dealId={dealId} />;
}

const DealDetailPage = async ({ params }: PageProps) => {
  const { dealId } = await params;
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Link href="/deals">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deals
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="information" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Information
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <Suspense
            fallback={<LoadingFallback message="Loading overview..." />}
          >
            <OverviewTabContent dealId={dealId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="actions" className="mt-0">
          <Suspense fallback={<LoadingFallback message="Loading actions..." />}>
            <ActionsTabContent dealId={dealId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="information" className="mt-0">
          <Suspense
            fallback={<LoadingFallback message="Loading information..." />}
          >
            <InformationTabContent dealId={dealId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DealDetailPage;
