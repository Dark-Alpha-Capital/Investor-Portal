import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppLink as Link } from "@/components/app-link";
import { UserPlus, Eye, FolderKey } from "lucide-react";
import { cn } from "@/lib/utils";

type Invite = {
  id: string;
  userId: string;
  accessLevel: string;
  notes: string | null;
  grantedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    isOnboardingCompleted: boolean;
  };
};

const ACCESS_META: Record<
  string,
  { label: string; icon: typeof Eye; className: string }
> = {
  teaser: {
    label: "Teaser",
    icon: Eye,
    className:
      "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  data_room: {
    label: "Data room",
    icon: FolderKey,
    className:
      "border-violet-600/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
};

const TINT_PALETTE = [
  "bg-primary/10 text-primary",
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  "bg-violet-500/10 text-violet-700 dark:text-violet-400",
];

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TINT_PALETTE[hash % TINT_PALETTE.length];
}

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

export function InvitesTab({ invites }: { invites: Invite[] }) {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Invited investors
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Investors granted access via Compliance
          </p>
        </div>
        <span className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs font-medium tabular-nums text-muted-foreground">
          {invites.length} {invites.length === 1 ? "invite" : "invites"}
        </span>
      </header>

      {invites.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 py-20 text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
            <UserPlus className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              No investors invited yet
            </p>
            <p className="text-sm text-muted-foreground">
              Invite investors from the Compliance section.
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
                  Access
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Notes
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Invited
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => {
                const access =
                  ACCESS_META[invite.accessLevel] ?? {
                    label: invite.accessLevel.replace(/_/g, " "),
                    icon: Eye,
                    className:
                      "border-border bg-muted text-muted-foreground",
                  };
                const AccessIcon = access.icon;
                return (
                  <TableRow
                    key={invite.id}
                    className="group transition-colors hover:bg-muted/40"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold",
                            tintFor(invite.user.name),
                          )}
                        >
                          {invite.user.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/compliance/investors/${invite.user.id}`}
                              className="truncate text-sm font-medium hover:text-primary hover:underline"
                            >
                              {invite.user.name}
                            </Link>
                            {invite.user.isOnboardingCompleted ? (
                              <span
                                className="size-1.5 shrink-0 rounded-full bg-emerald-500"
                                title="Onboarding completed"
                              />
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {invite.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          access.className,
                        )}
                      >
                        <AccessIcon className="size-3" />
                        {access.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {invite.notes ? (
                        <span className="text-sm text-muted-foreground">
                          {invite.notes}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground/60">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {formatDate(invite.grantedAt)}
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
