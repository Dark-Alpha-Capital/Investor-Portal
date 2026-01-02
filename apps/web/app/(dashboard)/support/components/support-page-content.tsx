import { caller } from "@/trpc/server";
import { MyTicketsList } from "./my-tickets-list";
import { CreateTicketForm } from "./create-ticket-form";

type SearchParams = Promise<{
  page?: string;
  status?: string;
}>;

export async function SupportPageContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  // Parse search params
  const page = parseInt(params.page || "1", 10);
  const status = params.status || "all";

  // Fetch tickets
  const ticketsData = await caller.tickets.getMyTickets({
    page,
    limit: 10,
    status: status !== "all" ? status : undefined,
  });

  return (
    <div className="space-y-8">
      {/* Create Ticket Form */}
      <CreateTicketForm />

      {/* My Tickets List */}
      <MyTicketsList
        initialData={ticketsData}
        initialPage={page}
        initialStatus={status}
      />
    </div>
  );
}
