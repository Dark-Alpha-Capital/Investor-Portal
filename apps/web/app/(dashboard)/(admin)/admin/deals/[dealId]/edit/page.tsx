import React, { Suspense } from "react";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { EditDealForm } from "../components/edit-deal-form";
import BackButton from "@/components/back-button";

type PageProps = {
  params: Promise<{
    dealId: string;
  }>;
};

const EditDealPage = async ({ params }: PageProps) => {
  const { dealId } = await params;
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <BackButton />
      <div className="mt-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Deal</h1>
        <p className="text-muted-foreground mt-2">Update deal information</p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading deal...
            </div>
          </div>
        }
      >
        <EditDealForm dealId={dealId} />
      </Suspense>
    </div>
  );
};

export default EditDealPage;
