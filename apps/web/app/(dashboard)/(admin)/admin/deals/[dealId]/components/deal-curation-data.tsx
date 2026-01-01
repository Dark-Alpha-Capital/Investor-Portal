import "server-only";
import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { caller } from "@/trpc/server";
import { DealCurationTabs } from "./deal-curation-tabs";

type DealCurationDataProps = {
  params: Promise<{
    dealId: string;
  }>;
};

export async function DealCurationData({ params }: DealCurationDataProps) {
  const session = await authSession();

  if (!session) {
    console.log("User is not logged in");
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    console.log("User is not admin");
    console.log(session.user.role);
    redirect("/dashboard");
  }

  const { dealId } = await params;
  console.log("Deal ID:", dealId);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">
            Loading investors...
          </div>
        </div>
      }
    >
      <FetchDealCurationWrapper dealId={dealId} />
    </Suspense>
  );
}

async function FetchDealCurationWrapper({ dealId }: { dealId: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`deal-${dealId}`);
  cacheTag("admin-deals");

  const [investorsResult, invitesResult] = await Promise.all([
    caller.deals.getInvestors(),
    caller.deals.getInvites({ dealId }),
  ]);

  return (
    <DealCurationTabs
      dealId={dealId}
      investors={investorsResult.investors}
      invites={invitesResult.invites}
    />
  );
}
