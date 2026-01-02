import { caller } from "@/trpc/server";
import { TicketsTableClient } from "./tickets-table-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Inbox,
  Clock,
  AlertCircle,
  CheckCircle2,
  UserMinus,
} from "lucide-react";

type SearchParams = Promise<{
  page?: string;
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
}>;

export async function TicketsDashboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  // Parse search params
  const page = parseInt(params.page || "1", 10);
  const status = params.status || "all";
  const priority = params.priority || "all";
  const category = params.category || "all";
  const assignedTo = params.assignedTo || "all";

  // Fetch data in parallel
  const [ticketsData, metricsData, adminUsers] = await Promise.all([
    caller.tickets.getTickets({
      page,
      limit: 12,
      search: params.search,
      status: status !== "all" ? status : undefined,
      priority: priority !== "all" ? priority : undefined,
      category: category !== "all" ? category : undefined,
      assignedTo: assignedTo !== "all" ? assignedTo : undefined,
    }),
    caller.tickets.getTicketMetrics(),
    caller.tickets.getAdminUsers(),
  ]);

  const metrics = metricsData.metrics;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.open}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending User</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingUser}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting investor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">
              Completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.unassigned}</div>
            <p className="text-xs text-muted-foreground">
              Needs assignment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <TicketsTableClient
        initialData={ticketsData}
        initialPage={page}
        initialStatus={status}
        initialPriority={priority}
        initialCategory={category}
        initialAssignedTo={assignedTo}
        adminUsers={adminUsers}
      />
    </div>
  );
}
