import { caller } from "@/trpc/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketHeader } from "./ticket-header";
import { TicketInfo } from "./ticket-info";
import { TicketActions } from "./ticket-actions";
import { TicketComments } from "./ticket-comments";
import { AddCommentForm } from "./add-comment-form";

type Props = {
  ticketId: string;
};

export async function TicketDetailContent({ ticketId }: Props) {
  // Fetch ticket data and admin users in parallel
  const [ticketResult, adminUsers] = await Promise.all([
    caller.tickets.getTicketById({ ticketId }).catch(() => null),
    caller.tickets.getAdminUsers(),
  ]);

  if (!ticketResult || !ticketResult.success) {
    notFound();
  }

  const { ticket, comments } = ticketResult;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" asChild className="-ml-4">
        <Link href="/admin/tickets">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Link>
      </Button>

      {/* Header with status and priority badges */}
      <TicketHeader
        subject={ticket.subject}
        status={ticket.status}
        priority={ticket.priority}
        createdAt={ticket.createdAt}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Comments */}
          <TicketComments comments={comments} />

          {/* Add comment form */}
          {ticket.status !== "closed" && (
            <AddCommentForm ticketId={ticketId} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <TicketInfo
            ticketId={ticketId}
            category={ticket.category}
            investor={ticket.investor}
            assignee={ticket.assignee}
            createdAt={ticket.createdAt}
            updatedAt={ticket.updatedAt}
            resolvedAt={ticket.resolvedAt}
            resolver={ticket.resolver}
            resolution={ticket.resolution}
          />

          {/* Actions */}
          {ticket.status !== "closed" && (
            <TicketActions
              ticketId={ticketId}
              currentStatus={ticket.status}
              currentAssignee={ticket.assignee?.id || null}
              adminUsers={adminUsers}
            />
          )}
        </div>
      </div>
    </div>
  );
}
