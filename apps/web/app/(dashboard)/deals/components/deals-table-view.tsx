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
    <div className="overflow-hidden rounded-lg border border-border/50 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/50">
            <TableHead className="w-[300px] font-semibold">Deal</TableHead>
            <TableHead className="font-semibold">Sector</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Target Raise</TableHead>
            <TableHead className="text-right font-semibold">Min Investment</TableHead>
            <TableHead className="text-right font-semibold">Target IRR</TableHead>
            <TableHead className="text-right font-semibold">Target MOIC</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal, index) => (
            <TableRow
              key={deal.id}
              className="group border-b border-border/50 transition-colors duration-150 hover:bg-muted/30"
              style={{
                animation: `fadeIn 0.3s ease-out ${index * 30}ms both`,
              }}
            >
              <TableCell>
                <Link
                  href={`/deals/${deal.id}`}
                  className="block transition-colors duration-150 hover:text-primary"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{deal.name}</span>
                    {deal.isCurated && (
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  {deal.teaserSummary && (
                    <p className="mt-0.5 max-w-[280px] text-xs text-muted-foreground line-clamp-1">
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
              <TableCell className="text-right tabular-nums font-medium">
                {formatCurrency(deal.targetRaise)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatCurrency(deal.minInvestment)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {deal.targetIrr
                  ? `${parseFloat(deal.targetIrr).toFixed(1)}%`
                  : "-"}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {deal.targetMoic
                  ? `${parseFloat(deal.targetMoic).toFixed(2)}x`
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
