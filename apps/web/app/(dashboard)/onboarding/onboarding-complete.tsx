"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function OnboardingComplete() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-3xl font-bold mb-3">{"Onboarding Complete!"}</h1>
        <p className="text-muted-foreground mb-8 text-balance">
          {
            "Thank you for completing your investor onboarding. Your information has been successfully submitted and is now being reviewed by our team."
          }
        </p>

        <div className="bg-accent border border-border rounded-lg p-4 mb-8 text-left">
          <h3 className="font-semibold text-sm mb-3">{"What happens next?"}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              {"Your documents will be verified within 1-2 business days"}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              {"You'll receive an email confirmation once approved"}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              {"Our team may contact you if additional information is needed"}
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleGoToDashboard}
          >
            {"Go to Dashboard"}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full bg-transparent gap-2"
            onClick={handleGoHome}
          >
            <Home className="w-4 h-4" />
            {"Back to Main Site"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
