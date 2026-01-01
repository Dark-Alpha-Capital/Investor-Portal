import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DealDetailContent } from "./components/deal-detail-content";

type PageProps = {
  params: Promise<{
    dealId: string;
  }>;
};

const DealDetailPage = async ({ params }: PageProps) => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Link href="/deals">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deals
          </Button>
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading deal details...
            </div>
          </div>
        }
      >
        <DealDetailContent params={params} />
      </Suspense>
    </div>
  );
};

export default DealDetailPage;
