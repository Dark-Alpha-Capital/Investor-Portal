import { Card } from "@/components/ui/card";
import { Clock, CheckCircle2 } from "lucide-react";

export function KycReviewScreen() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-3">KYC Under Review</h1>
            <p className="text-muted-foreground text-balance">
              Your onboarding documents are currently being reviewed by our team.
            </p>
          </div>

          <div className="bg-accent border border-border rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              What happens next?
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  Our compliance team is reviewing your submitted documents
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  Review typically takes 1-2 business days
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  You'll receive an email notification once the review is complete
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  If additional information is needed, we'll contact you directly
                </span>
              </li>
            </ul>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Thank you for your patience. We'll notify you as soon as your KYC
              verification is complete.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}






