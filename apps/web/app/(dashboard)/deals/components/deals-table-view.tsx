"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles } from "lucide-react";

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
  curationNote?: string | null;
  isCurated?: boolean;
};

type DealsTableViewProps = {
  deals: Deal[];
};

const formatCurrency = (value: string | null) => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${num.toLocaleString()}`;
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, " ");
};

export function DealsTableView({ deals }: DealsTableViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[300px]">Deal</TableHead>
          <TableHead>Sector</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Target Raise</TableHead>
          <TableHead className="text-right">Min Investment</TableHead>
          <TableHead className="text-right">Target IRR</TableHead>
          <TableHead className="text-right">Target MOIC</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.map((deal) => (
          <TableRow key={deal.id} className="group">
            <TableCell>
              <Link
                href={`/deals/${deal.id}`}
                className="block hover:text-primary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{deal.name}</span>
                  {deal.isCurated && (
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                {deal.teaserSummary && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[280px]">
                    {deal.teaserSummary}
                  </p>
                )}
              </Link>
            </TableCell>
            <TableCell>
              <span className="text-muted-foreground">{deal.sector || "-"}</span>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="capitalize">
                {formatStatus(deal.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(deal.targetRaise)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(deal.minInvestment)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {deal.targetIrr ? `${parseFloat(deal.targetIrr).toFixed(1)}%` : "-"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {deal.targetMoic ? `${parseFloat(deal.targetMoic).toFixed(2)}x` : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
