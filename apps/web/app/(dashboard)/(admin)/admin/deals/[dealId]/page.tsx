import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { authSession } from "@/app/(auth)/auth";
import { DealDetailView } from "./components/deal-detail-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Users } from "lucide-react";

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

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading deal details...
            </div>
          </div>
        }
      >
        <DealDetailView dealId={dealId} />
      </Suspense>
    </div>
  );
};

export default DealDetailPage;





