import { Suspense } from "react";
import { TicketDetailContent } from "./components/ticket-detail-content";
import { notFound } from "next/navigation";

type Params = Promise<{ ticketId: string }>;

/**
 * Admin Ticket Detail Page
 *
 * Shows full ticket details with actions for admin to manage the ticket.
 */
export default async function TicketDetailPage({
  params,
}: {
  params: Params;
}) {
  const { ticketId } = await params;

  if (!ticketId) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading ticket...
            </div>
          </div>
        }
      >
        <TicketDetailContent ticketId={ticketId} />
      </Suspense>
    </div>
  );
}
