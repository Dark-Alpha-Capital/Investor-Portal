"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit, Eye, Trash2, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

type Deal = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  teaserSummary: string | null;
  sector: string | null;
  geography: string | null;
  dealType: string | null;
  targetRaise: number | null;
  minInvestment: number | null;
  targetIrr: number | null;
  targetMoic: number | null;
  status: string;
  visibility: string;
  coverImageUrl: string | null;
  launchDate: Date | null;
  closeDate: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
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

export function DealsTable({ deals }: { deals: Deal[] }) {
  const router = useRouter();
  const trpc = useTRPC();

  const { mutate: deleteDeal, isPending: isDeleting } = useMutation(
    trpc.deals.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Deal deleted successfully");
        router.refresh();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete deal");
      },
    })
  );

  const handleDelete = async (dealId: string, dealName: string) => {
    if (!confirm(`Are you sure you want to delete "${dealName}"?`)) {
      return;
    }

    deleteDeal({ dealId });
  };

  if (deals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">
              No deals found. Create your first deal to get started.
            </p>
            <Link href="/admin/deals/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Deal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Deals</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Target Raise</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/deals/${deal.id}`}
                    className="hover:underline"
                  >
                    {deal.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={statusColors[deal.status] as any}>
                    {deal.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={visibilityColors[deal.visibility] as any}>
                    {deal.visibility.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>{deal.sector || "-"}</TableCell>
                <TableCell>
                  {deal.targetRaise
                    ? `$${deal.targetRaise.toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell>{deal.createdAt.toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/deals/${deal.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/deals/${deal.id}/curate`}>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/deals/${deal.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(deal.id, deal.name)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
