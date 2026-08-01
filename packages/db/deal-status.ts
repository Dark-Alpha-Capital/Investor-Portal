export const dealLifecycleStatuses = [
  "draft",
  "coming_soon",
  "live",
  "closing",
  "funded",
  "exited",
  "cancelled",
] as const;

export type DealLifecycleStatus = (typeof dealLifecycleStatuses)[number];

export const dealLifecycleStatusLabels: Record<DealLifecycleStatus, string> = {
  draft: "Draft",
  coming_soon: "Coming Soon",
  live: "Live",
  closing: "Closing",
  funded: "Funded",
  exited: "Exited",
  cancelled: "Cancelled",
};

export function isDealLifecycleStatus(
  value: string,
): value is DealLifecycleStatus {
  return (dealLifecycleStatuses as readonly string[]).includes(value);
}

/** Column is visible when no status filter is set, or filter includes this column. */
export function kanbanColumnMatchesStatusFilter(
  columnStatus: DealLifecycleStatus,
  filterStatuses: string[] | undefined,
): boolean {
  if (!filterStatuses?.length) {
    return true;
  }

  return filterStatuses.some(
    (status) =>
      status === columnStatus ||
      (isDealLifecycleStatus(status) && status === columnStatus),
  );
}
