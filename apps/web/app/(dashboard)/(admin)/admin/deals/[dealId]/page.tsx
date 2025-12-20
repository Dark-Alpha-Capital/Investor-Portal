import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import { DealDetailView } from "./components/deal-detail-view";
import { OverviewTab } from "./components/overview-tab";
import { InvitesTab } from "./components/invites-tab";
import { InterestsTab } from "./components/interests-tab";
import { InvestmentsTabWrapper } from "./components/investments-tab-wrapper";
import { FilesTabServer } from "./components/files-tab-server";
import { TabCounts } from "./components/tab-counts";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { caller } from "@/trpc/server";

type PageProps = {
  params: Promise<{
    dealId: string;
  }>;
};

const DealDetailPage = async ({ params }: PageProps) => {
  const { dealId } = await params;
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/deals">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deals
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/admin/deals/${dealId}/curate`}>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Curate
            </Button>
          </Link>
          <Link href={`/admin/deals/${dealId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Deal
            </Button>
          </Link>
        </div>
      </div>

      {/* <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading deal details...
            </div>
          </div>
        }
      >
        <DealHeader dealId={dealId} />
      </Suspense> */}

      <Tabs defaultValue="overview" className="space-y-6 mt-6">
        <Suspense
          fallback={
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
              <TabsTrigger value="overview" disabled>
                Overview
              </TabsTrigger>
              <TabsTrigger value="invites" disabled>
                Invites
              </TabsTrigger>
              <TabsTrigger value="interests" disabled>
                Interests
              </TabsTrigger>
              <TabsTrigger value="investments" disabled>
                Investments
              </TabsTrigger>
              <TabsTrigger value="files" disabled>
                Files
              </TabsTrigger>
            </TabsList>
          }
        >
          <TabCounts dealId={dealId} />
        </Suspense>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">
                  Loading overview...
                </div>
              </div>
            }
          >
            <OverviewTab dealId={dealId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4 mt-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">
                  Loading invites...
                </div>
              </div>
            }
          >
            <InvitesTab dealId={dealId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="interests" className="space-y-4 mt-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">
                  Loading interests...
                </div>
              </div>
            }
          >
            <InterestsTab dealId={dealId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4 mt-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">
                  Loading investments...
                </div>
              </div>
            }
          >
            <InvestmentsTabWrapper dealId={dealId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="files" className="space-y-4 mt-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">
                  Loading files...
                </div>
              </div>
            }
          >
            <FilesTabServer dealId={dealId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DealDetailPage;

async function DealHeader({ dealId }: { dealId: string }) {
  try {
    const result = await caller.deals.getById({ dealId });
    return <DealDetailView deal={result.deal} />;
  } catch (error) {
    console.error("Error fetching deal:", error);
    return (
      <div className="text-center py-12">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Failed to load deal"}
        </p>
      </div>
    );
  }
}
