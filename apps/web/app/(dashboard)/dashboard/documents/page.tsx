import React, { Suspense } from "react";
import { headers } from "next/headers";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { DocumentsList } from "./components/documents-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DocumentsSkeleton } from "@/components/skeleton/documents-skeleton";
import { caller } from "@/trpc/server";

const DocumentsPage = async () => {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground mt-1">
              View your investment documents (K-1s, Quarterly Reports, etc.)
            </p>
          </div>
        </div>
      </div>
      <Suspense fallback={<DocumentsSkeleton />}>
        <FetchDocumentsWrapper />
      </Suspense>
    </div>
  );
};

async function FetchDocumentsWrapper() {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  // Redirect admins
  if (session.user.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Suspense fallback={<DocumentsSkeleton />}>
        <FetchDocumentsContent />
      </Suspense>
    </div>
  );
}

async function FetchDocumentsContent() {
  const documents = await caller.investments.getDocuments();

  // Convert Date objects to ISO strings for client component
  const formattedDocuments = documents.map((doc) => ({
    ...doc,
    periodStart: doc.periodStart ? doc.periodStart.toISOString() : null,
    periodEnd: doc.periodEnd ? doc.periodEnd.toISOString() : null,
    uploadedAt: doc.uploadedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  }));

  return <DocumentsList documents={formattedDocuments} />;
}

export default DocumentsPage;
