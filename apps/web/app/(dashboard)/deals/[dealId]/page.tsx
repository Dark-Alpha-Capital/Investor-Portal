import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import { DealDetailView } from "./components/deal-detail-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { db } from "@repo/db";
import { deal } from "@repo/db/schema";
import { eq, or } from "drizzle-orm";

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

  // Redirect admins to admin deals page
  if (session.user.role === "admin") {
    redirect(`/admin/deals/${dealId}`);
  }

  // Try to find deal by ID or slug
  const [dealRecord] = await db
    .select()
    .from(deal)
    .where(or(eq(deal.id, dealId), eq(deal.slug, dealId)))
    .limit(1);

  // If deal not found by slug, try ID
  const actualDealId = dealRecord?.id || dealId;

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

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading deal details...
            </div>
          </div>
        }
      >
        <DealDetailView dealId={actualDealId} />
      </Suspense>
    </div>
  );
};

export default DealDetailPage;

