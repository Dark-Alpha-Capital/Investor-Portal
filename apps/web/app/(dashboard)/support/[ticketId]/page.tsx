import { Suspense } from "react";
import { InvestorTicketContent } from "./components/investor-ticket-content";
import { notFound } from "next/navigation";

type Params = Promise<{ ticketId: string }>;

/**
 * Investor Ticket Detail Page
 *
 * Shows ticket details for the investor's own ticket.
 * Only displays public comments (not internal admin notes).
 */
export default async function InvestorTicketDetailPage({
  params,
}: {
  params: Params;
}) {
  const { ticketId } = await params;

  if (!ticketId) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading ticket...
            </div>
          </div>
        }
      >
        <InvestorTicketContent ticketId={ticketId} />
      </Suspense>
    </div>
  );
}
