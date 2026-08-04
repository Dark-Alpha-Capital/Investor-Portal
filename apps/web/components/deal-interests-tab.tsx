import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppLink as Link } from "@/components/app-link";
import { InitialsTile } from "@/components/initials-tile";
import { Target, Handshake, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Interest = {
  id: string;
  userId: string;
  status: string;
  proposedAmount: string | null;
  createdAt: string;
  updatedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

const STAGE_META: Record<
  string,
  { label: string; className: string }
> = {
  interested: {
    label: "Interested",
    className:
      "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  soft_committed: {
    label: "Soft committed",
    className:
      "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  meeting_requested: {
    label: "Meeting requested",
    className:
      "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  pass: {
    label: "Declined",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

const stageMeta = (status: string) =>
  STAGE_META[status] ?? {
    label: status.replace(/_/g, " "),
    className: "border-border bg-muted text-muted-foreground",
  };

const formatCurrency = (value: string | null | undefined): string => {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function InterestsTab({ interests }: { interests: Interest[] }) {
  const active = interests.filter((i) => i.status !== "pass");
  const totalProposed = active.reduce(
    (sum, i) => sum + parseFloat(i.proposedAmount || "0"),
    0,
  );
  const declined = interests.length - active.length;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <Target className="size-4 text-primary" />
            Interest pipeline
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Investors who expressed interest. Commitments appear under
            Investments.
          </p>
        </div>
        <span className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs font-medium tabular-nums text-muted-foreground">
          {interests.length} {interests.length === 1 ? "record" : "records"}
        </span>
      </header>

      {interests.length > 0 ? (
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          <div className="bg-card px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Interested
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {active.length}
            </p>
          </div>
          <div className="bg-card px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Estimated pipeline
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {formatCurrency(totalProposed.toString())}
            </p>
          </div>
          <div className="bg-card px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Declined
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {declined}
            </p>
          </div>
        </div>
      ) : null}

      {interests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 py-20 text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
            <Handshake className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              No interest yet
            </p>
            <p className="text-sm text-muted-foreground">
              Investors will appear here after expressing interest in this deal.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Investor
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Stage
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Estimated
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interests.map((interest) => {
                const meta = stageMeta(interest.status);
                const isDeclined = interest.status === "pass";
                return (
                  <TableRow
                    key={interest.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <InitialsTile name={interest.user.name} />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/compliance/investors/${interest.user.id}`}
                            className="block truncate text-sm font-medium hover:text-primary hover:underline"
                          >
                            {interest.user.name}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {interest.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          meta.className,
                        )}
                      >
                        {isDeclined ? (
                          <ThumbsDown className="size-3" />
                        ) : (
                          <Target className="size-3" />
                        )}
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-mono text-sm tabular-nums",
                        isDeclined
                          ? "text-muted-foreground"
                          : "font-medium text-foreground",
                      )}
                    >
                      {formatCurrency(interest.proposedAmount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {formatDate(interest.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
