import React, { Suspense } from "react";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { DealCurationForm } from "../components/deal-curation-form";

type PageProps = {
  params: Promise<{
    dealId: string;
  }>;
};

const CurateDealPage = async ({ params }: PageProps) => {
  const { dealId } = await params;
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Curate Deal</h1>
        <p className="text-muted-foreground mt-2">
          Select which investors can see this deal
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading deal curation...
            </div>
          </div>
        }
      >
        <DealCurationForm dealId={dealId} />
      </Suspense>
    </div>
  );
};

export default CurateDealPage;

