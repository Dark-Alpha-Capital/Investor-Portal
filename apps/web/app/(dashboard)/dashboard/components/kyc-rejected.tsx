"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Mail, ArrowRight } from "lucide-react";

export function KycRejectedScreen() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold mb-3">KYC Verification Rejected</h1>
            <p className="text-muted-foreground text-balance">
              Unfortunately, your KYC verification could not be completed at this time.
            </p>
          </div>

          <div className="bg-accent border border-border rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Next Steps
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please check your email for detailed information about why your
              verification was rejected and what steps you can take to resolve the issue.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Review the rejection reason in your email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Address any issues mentioned in the feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Resubmit your documents once corrections are made</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="default"
              size="lg"
              onClick={() => router.push("/onboarding?step=2")}
              className="gap-2"
            >
              Resubmit Documents
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => (window.location.href = "mailto:support@example.com")}
              className="gap-2"
            >
              Contact Support
              <Mail className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}






