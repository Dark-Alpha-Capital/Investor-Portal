
import { useRouter } from "@/hooks/use-app-navigation";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";

export function OnboardingRequiredScreen() {
  const router = useRouter();

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <section className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Onboarding Required</h1>
            <p className="text-muted-foreground text-balance">
              In order to access the dashboard, you need to first complete your onboarding process.
            </p>
          </div>

          <div className="bg-accent border border-border rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-sm mb-4">
              What you need to do:
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  Complete your onboarding profile and submit required information
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  Upload all necessary KYC documents for verification
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  Wait for compliance review and approval
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  Once approved, you'll have full access to the dashboard
                </span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/onboarding")}
              className="gap-2"
            >
              Start Onboarding
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
