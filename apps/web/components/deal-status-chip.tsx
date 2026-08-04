import { cn } from "@/lib/utils";

const STATUS_META: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  draft: {
    label: "Draft",
    className:
      "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  coming_soon: {
    label: "Coming soon",
    className: "border-primary/30 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  live: {
    label: "Live",
    className: "border-primary/30 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  closing: {
    label: "Closing",
    className: "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  funded: {
    label: "Funded",
    className:
      "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  exited: {
    label: "Exited",
    className: "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

export function DealStatusChip({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status.replace(/_/g, " "),
    className: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em]",
        meta.className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}
