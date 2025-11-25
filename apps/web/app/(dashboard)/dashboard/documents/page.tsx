import React, { Suspense } from "react";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentsList } from "./components/documents-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

const DocumentsPage = async () => {
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground mt-1">
              View your investment documents (K-1s, Quarterly Reports, etc.)
            </p>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">
                  Loading documents...
                </div>
              </div>
            </CardContent>
          </Card>
        }
      >
        <DocumentsList />
      </Suspense>
    </div>
  );
};

export default DocumentsPage;

