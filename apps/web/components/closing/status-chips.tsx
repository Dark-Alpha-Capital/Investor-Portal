import { Badge } from "@/components/ui/badge";
import {
  INVESTMENT_STATUS_LABELS,
  SUBSCRIPTION_DOCUMENT_STATUS_LABELS,
  SUBSCRIPTION_DOCUMENT_TYPE_LABELS,
} from "@repo/db/investment-closing";
import { cn } from "@/lib/utils";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  pending_documents: "outline",
  documents_generated: "outline",
  awaiting_signature: "outline",
  awaiting_funds: "outline",
  funded: "default",
  closed: "default",
  cancelled: "destructive",
  expired: "destructive",
  rejected: "destructive",
  transferred: "secondary",
  liquidated: "secondary",
  written_off: "destructive",
  not_generated: "secondary",
  generated: "outline",
  available: "outline",
  sent: "outline",
  downloaded: "outline",
  signed: "default",
  executed: "default",
};

export function InvestmentStatusChip({ status }: { status: string }) {
  return (
    <Badge variant={statusVariant[status] ?? "secondary"}>
      {INVESTMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function DocumentStatusChip({ status }: { status: string }) {
  return (
    <Badge variant={statusVariant[status] ?? "secondary"}>
      {SUBSCRIPTION_DOCUMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function documentTypeLabel(type: string): string {
  return SUBSCRIPTION_DOCUMENT_TYPE_LABELS[type] ?? type;
}

const TIMELINE_STEPS = [
  {
    key: "submitted",
    label: "Commitment Submitted",
    statuses: [
      "draft",
      "pending_documents",
      "documents_generated",
      "awaiting_signature",
      "awaiting_funds",
      "funded",
      "closed",
    ],
  },
  {
    key: "documents",
    label: "Documents Generated",
    statuses: [
      "documents_generated",
      "awaiting_signature",
      "awaiting_funds",
      "funded",
      "closed",
    ],
  },
  {
    key: "signature",
    label: "Signature",
    statuses: ["awaiting_signature", "awaiting_funds", "funded", "closed"],
    pendingLabel: "Pending Signature",
    doneStatuses: ["awaiting_funds", "funded", "closed"],
  },
  {
    key: "funds",
    label: "Awaiting Funds",
    statuses: ["awaiting_funds", "funded", "closed"],
    doneStatuses: ["funded", "closed"],
  },
  {
    key: "complete",
    label: "Investment Complete",
    statuses: ["funded", "closed"],
    doneStatuses: ["closed", "funded"],
  },
] as const;

export function ClosingTimeline({ status }: { status: string }) {
  const terminal =
    status === "cancelled" || status === "expired" || status === "rejected";

  if (terminal) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">
          Commitment {INVESTMENT_STATUS_LABELS[status] ?? status}
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {TIMELINE_STEPS.map((step) => {
        const reached = (step.statuses as readonly string[]).includes(status);
        const done =
          "doneStatuses" in step && step.doneStatuses
            ? (step.doneStatuses as readonly string[]).includes(status)
            : reached &&
              step.key !== "signature" &&
              !(step.key === "funds" && status === "awaiting_funds");

        const isCurrent =
          reached &&
          !done &&
          (step.key === "signature"
            ? status === "awaiting_signature"
            : step.key === "funds"
              ? status === "awaiting_funds"
              : step.key === "documents"
                ? status === "documents_generated"
                : step.key === "submitted"
                  ? status === "draft" || status === "pending_documents"
                  : false);

        const label =
          isCurrent && "pendingLabel" in step && step.pendingLabel
            ? step.pendingLabel
            : step.label;

        return (
          <li key={step.key} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs",
                done
                  ? "bg-primary text-primary-foreground"
                  : isCurrent
                    ? "border-2 border-primary text-primary"
                    : "border border-muted-foreground/30 text-muted-foreground",
              )}
            >
              {done ? "✓" : ""}
            </span>
            <div>
              <p
                className={cn(
                  "text-sm",
                  done || isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </p>
              {isCurrent ? (
                <p className="text-xs text-muted-foreground">In progress</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
