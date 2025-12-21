import React, { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { DealsTable } from "./components/deals-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { caller } from "@/trpc/server";

const DealsPage = async () => {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Deals Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage investment deals
          </p>
        </div>
        <Link href="/admin/deals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Deal
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <Suspense
          fallback={
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">
                    Loading deals...
                  </div>
                </div>
              </CardContent>
            </Card>
          }
        >
          <FetchDealsTable />
        </Suspense>
      </div>
    </div>
  );
};

export default DealsPage;

async function FetchDealsTable() {
  const deals = await caller.deals.getDeals();
  return <DealsTable deals={deals} />;
}
