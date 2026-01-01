import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

type Deal = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  teaserSummary: string | null;
  sector: string | null;
  geography: string | null;
  dealType: string | null;
  targetRaise: string | null;
  minInvestment: string | null;
  targetIrr: string | null;
  targetMoic: string | null;
  status: string;
  visibility: string;
  coverImageUrl: string | null;
  launchDate: string | null;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string | null;
};

const statusColors: Record<string, string> = {
  draft: "secondary",
  coming_soon: "default",
  live: "default",
  closing: "default",
  funded: "default",
  exited: "default",
  cancelled: "destructive",
};

const visibilityColors: Record<string, string> = {
  public: "default",
  accredited: "default",
  invite_only: "secondary",
};

const formatCurrency = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatPercentage = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  return `${num.toFixed(2)}%`;
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function OverviewTab({ deal }: { deal: Deal }) {
  return (
    <div className="max-w-3xl mx-auto">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium w-1/3 text-muted-foreground">
              Deal Name
            </TableCell>
            <TableCell className="font-semibold">{deal.name}</TableCell>
          </TableRow>

          {deal.slug && (
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                Slug
              </TableCell>
              <TableCell>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {deal.slug}
                </code>
              </TableCell>
            </TableRow>
          )}

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Deal Type
            </TableCell>
            <TableCell>{deal.dealType || "-"}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Status
            </TableCell>
            <TableCell>
              <Badge
                variant={statusColors[deal.status] as any}
                className="text-xs"
              >
                {deal.status.replace(/_/g, " ")}
              </Badge>
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Visibility
            </TableCell>
            <TableCell>
              <Badge
                variant={visibilityColors[deal.visibility] as any}
                className="text-xs"
              >
                {deal.visibility.replace(/_/g, " ")}
              </Badge>
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Sector
            </TableCell>
            <TableCell>{deal.sector || "-"}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Geography
            </TableCell>
            <TableCell>{deal.geography || "-"}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Target Raise
            </TableCell>
            <TableCell className="font-semibold">
              {formatCurrency(deal.targetRaise)}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Minimum Investment
            </TableCell>
            <TableCell className="font-semibold">
              {formatCurrency(deal.minInvestment)}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Target IRR
            </TableCell>
            <TableCell className="font-semibold">
              {formatPercentage(deal.targetIrr)}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Target MOIC
            </TableCell>
            <TableCell>{deal.targetMoic || "-"}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Launch Date
            </TableCell>
            <TableCell>{formatDate(deal.launchDate)}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Close Date
            </TableCell>
            <TableCell>{formatDate(deal.closeDate)}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-medium text-muted-foreground">
              Created
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(deal.createdAt)}
            </TableCell>
          </TableRow>

          {deal.updatedAt && (
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                Last Updated
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(deal.updatedAt)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
