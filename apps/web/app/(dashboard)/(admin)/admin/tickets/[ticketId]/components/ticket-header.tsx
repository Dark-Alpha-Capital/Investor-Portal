import { Badge } from "@/components/ui/badge";
import {
  Inbox,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type Props = {
  subject: string;
  status: string;
  priority: string;
  createdAt: Date | null;
};

const getStatusBadge = (status: string) => {
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
      label: "Pending User",
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

  const c = config[status] || config.open;
  return (
    <Badge variant={c.variant} className="gap-1 text-sm">
      {c.icon}
      {c.label}
    </Badge>
  );
};

const getPriorityBadge = (priority: string) => {
  const config: Record<string, { className: string; label: string }> = {
    low: { className: "bg-green-100 text-green-800", label: "Low" },
    medium: { className: "bg-yellow-100 text-yellow-800", label: "Medium" },
    high: { className: "bg-orange-100 text-orange-800", label: "High" },
    urgent: { className: "bg-red-100 text-red-800", label: "Urgent" },
  };

  const c = config[priority] || config.medium;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${c.className}`}>
      {c.label} Priority
    </span>
  );
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

export function TicketHeader({ subject, status, priority, createdAt }: Props) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {getStatusBadge(status)}
        {getPriorityBadge(priority)}
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">{subject}</h1>
      <p className="text-sm text-muted-foreground">
        Created {formatDate(createdAt)}
      </p>
    </div>
  );
}
