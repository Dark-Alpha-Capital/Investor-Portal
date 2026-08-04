import { AppLink as Link } from "@/components/app-link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArchiveX, ArrowLeft, ShieldQuestion } from "lucide-react";

export function DealNoLongerAvailable() {
  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-muted p-2">
            <ArchiveX className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl">Deal No Longer Available</h3>
            <p>This investment opportunity has been withdrawn</p>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <Alert>
            <ShieldQuestion className="h-4 w-4" />
            <AlertTitle>Investment withdrawn</AlertTitle>
            <AlertDescription>
              This deal is no longer being offered. If you had an active
              commitment or interest in this deal, your records are preserved
              and remain visible under My Investments. Contact your
              relationship manager with any questions.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" asChild>
              <Link href="/deals">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Deals
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/investments">My Investments</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
