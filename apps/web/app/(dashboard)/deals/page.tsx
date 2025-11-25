import React, { Suspense } from "react";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PublicDealsSection } from "./components/public-deals-section";
import { CuratedDealsSection } from "./components/curated-deals-section";

const DealsPage = async () => {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  // Redirect admins to admin deals page
  if (session.user.role === "admin") {
    redirect("/admin/deals");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Deal Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Discover investment opportunities tailored to your profile
        </p>
      </div>

      <div className="space-y-12">
        {/* Curated Deals Section - Streamed separately */}
        <Suspense
          fallback={
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">
                    Loading curated deals...
                  </div>
                </div>
              </CardContent>
            </Card>
          }
        >
          <CuratedDealsSection />
        </Suspense>

        {/* Public/Accredited Deals Section - Streamed separately */}
        <Suspense
          fallback={
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">
                    Loading available deals...
                  </div>
                </div>
              </CardContent>
            </Card>
          }
        >
          <PublicDealsSection />
        </Suspense>
      </div>
    </div>
  );
};

export default DealsPage;
