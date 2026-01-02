import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Inbox,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Tag,
} from "lucide-react";

type Ticket = {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  resolvedAt: Date | null;
  resolution: string | null;
};

type Props = {
  ticket: Ticket;
};

const getStatusConfig = (status: string) => {
  const config: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
      icon: React.ReactNode;
    }
  > = {
    open: {
      variant: "default",
      label: "Open",
      icon: <Inbox className="h-3 w-3" />,
    },
    in_progress: {
      variant: "secondary",
      label: "In Progress",
      icon: <Clock className="h-3 w-3" />,
    },
    pending_user: {
      variant: "outline",
      label: "Awaiting Your Response",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    resolved: {
      variant: "default",
      label: "Resolved",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    closed: {
      variant: "secondary",
      label: "Closed",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  return config[status] || config.open;
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    credentials: "Login/Credentials",
    documents: "Documents",
    profile: "Profile Update",
    banking: "Banking",
    investment: "Investment",
    other: "Other",
  };
  return labels[category] || category;
};

const formatDate = (date: Date | null) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function InvestorTicketView({ ticket }: Props) {
  const statusConfig = getStatusConfig(ticket.status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusConfig.variant} className="gap-1">
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Tag className="h-3 w-3" />
            {getCategoryLabel(ticket.category)}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Submitted {formatDate(ticket.createdAt)}
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {ticket.description}
          </p>
        </CardContent>
      </Card>

      {/* Resolution (if resolved) */}
      {ticket.resolution && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-900 whitespace-pre-wrap">
              {ticket.resolution}
            </p>
            {ticket.resolvedAt && (
              <p className="text-sm text-green-700 mt-2">
                Resolved on {formatDate(ticket.resolvedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
