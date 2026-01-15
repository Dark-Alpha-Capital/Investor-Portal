import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Calendar, CheckCircle2 } from "lucide-react";

type Props = {
  ticketId: string;
  category: string;
  investor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  resolvedAt: Date | null;
  resolver: { id: string; name: string | null } | null;
  resolution: string | null;
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    credentials: "Login/Credentials",
    documents: "Documents",
    profile: "Profile Update",
    banking: "Banking Information",
    investment: "Investment Question",
    other: "Other",
  };
  return labels[category] || category;
};

const formatDate = (date: Date | null) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function TicketInfo({
  ticketId,
  category,
  investor,
  assignee,
  createdAt,
  updatedAt,
  resolvedAt,
  resolver,
  resolution,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ticket Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ticket ID */}
        <div>
          <p className="text-sm text-muted-foreground">Ticket ID</p>
          <p className="font-mono text-sm">{ticketId}</p>
        </div>

        {/* Category */}
        <div>
          <p className="text-sm text-muted-foreground">Category</p>
          <p className="font-medium">{getCategoryLabel(category)}</p>
        </div>

        {/* Investor */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Investor</p>
          {investor ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={investor.image || undefined} />
                <AvatarFallback>{getInitials(investor.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{investor.name || "No Name"}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {investor.email}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Unknown</p>
          )}
        </div>

        {/* Assignee */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Assigned To</p>
          {assignee ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{assignee.name || assignee.email}</span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Unassigned</p>
          )}
        </div>

        {/* Timestamps */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span>{formatDate(createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Updated:</span>
            <span>{formatDate(updatedAt)}</span>
          </div>
          {resolvedAt && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Resolved:</span>
              <span>{formatDate(resolvedAt)}</span>
            </div>
          )}
        </div>

        {/* Resolution */}
        {resolution && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">Resolution</p>
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800 whitespace-pre-wrap">{resolution}</p>
              {resolver && (
                <p className="text-xs text-green-600 mt-2">
                  Resolved by {resolver.name}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
