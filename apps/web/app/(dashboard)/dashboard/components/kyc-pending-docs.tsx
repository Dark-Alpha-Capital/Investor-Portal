"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, ArrowRight } from "lucide-react";

export function KycPendingDocsScreen() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Additional Documents Required</h1>
            <p className="text-muted-foreground text-balance">
              We need some additional documents to complete your KYC verification.
            </p>
          </div>

          <div className="bg-accent border border-border rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Action Required
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please review your onboarding submission and provide any missing or
              additional documents that may be required.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Check your email for specific document requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Ensure all documents are clear and legible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Documents should not be expired</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/onboarding?step=2")}
              className="gap-2"
            >
              Upload Additional Documents
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}




































