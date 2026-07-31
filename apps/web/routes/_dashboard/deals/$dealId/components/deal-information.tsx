import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

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

type DealInformationProps = {
  deal: Deal;
};

const formatCurrency = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
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

export function DealInformation({ deal }: DealInformationProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium w-1/3">Deal Type</TableCell>
            <TableCell>{deal.dealType || "-"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Status</TableCell>
            <TableCell>{deal.status.replace(/_/g, " ")}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Visibility</TableCell>
            <TableCell>{deal.visibility.replace(/_/g, " ")}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Sector</TableCell>
            <TableCell>{deal.sector || "-"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Geography</TableCell>
            <TableCell>{deal.geography || "-"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Target Raise</TableCell>
            <TableCell>{formatCurrency(deal.targetRaise)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Minimum Investment</TableCell>
            <TableCell>{formatCurrency(deal.minInvestment)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Target IRR</TableCell>
            <TableCell>{formatPercentage(deal.targetIrr)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Target MOIC</TableCell>
            <TableCell>
              {deal.targetMoic
                ? `${parseFloat(deal.targetMoic).toFixed(2)}x`
                : "-"}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Launch Date</TableCell>
            <TableCell>{formatDate(deal.launchDate)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Close Date</TableCell>
            <TableCell>{formatDate(deal.closeDate)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

