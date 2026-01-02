import { caller } from "@/trpc/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvestorTicketView } from "./investor-ticket-view";
import { InvestorComments } from "./investor-comments";
import { InvestorAddComment } from "./investor-add-comment";

type Props = {
  ticketId: string;
};

export async function InvestorTicketContent({ ticketId }: Props) {
  const ticketResult = await caller.tickets
    .getMyTicketById({ ticketId })
    .catch(() => null);

  if (!ticketResult || !ticketResult.success) {
    notFound();
  }

  const { ticket, comments } = ticketResult;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" asChild className="-ml-4">
        <Link href="/support">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Tickets
        </Link>
      </Button>

      {/* Ticket View */}
      <InvestorTicketView ticket={ticket} />

      {/* Comments */}
      <InvestorComments comments={comments} />

      {/* Add comment form (only if ticket is not closed) */}
      {ticket.status !== "closed" && ticket.status !== "resolved" && (
        <InvestorAddComment ticketId={ticketId} />
      )}

      {/* Message if ticket is closed/resolved */}
      {(ticket.status === "closed" || ticket.status === "resolved") && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          This ticket has been {ticket.status}. If you need further assistance,
          please{" "}
          <Link href="/support" className="text-primary hover:underline">
            create a new ticket
          </Link>
          .
        </div>
      )}
    </div>
  );
}
