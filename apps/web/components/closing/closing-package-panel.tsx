"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClosingTimeline,
  DocumentStatusChip,
  documentTypeLabel,
  InvestmentStatusChip,
} from "@/components/closing/status-chips";
import { formatCurrency } from "@/lib/utils";
import { investorDealDetailQueryKey } from "@/lib/types/investor-route-loaders";
import { Loader2 } from "lucide-react";

type ClosingPackagePanelProps = {
  dealId: string;
  investmentId: string;
  isAdmin?: boolean;
};

/** Documents are only shown once the GP releases the subscription package. */
const RELEASED_STATUSES = [
  "awaiting_signature",
  "awaiting_funds",
  "funded",
  "closed",
];

function formatMoney(value: number | string | null | undefined): string {
  if (value == null || value === "") return "—";
  const num = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(num)) return "—";
  return formatCurrency(num);
}

export function ClosingPackagePanel({
  dealId,
  investmentId,
  isAdmin = false,
}: ClosingPackagePanelProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const packageQuery = useQuery(
    trpc.subscriptionClosing.getPackage.queryOptions({ investmentId }),
  );

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.subscriptionClosing.getPackage.queryKey({ investmentId }),
    });
    await queryClient.invalidateQueries({
      queryKey: investorDealDetailQueryKey(dealId),
    });
  };

  const signMutation = useMutation(
    trpc.subscriptionClosing.signDocument.mutationOptions({
      onSuccess: async () => {
        toast.success("Document signed");
        await invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const cancelMutation = useMutation(
    trpc.subscriptionClosing.cancel.mutationOptions({
      onSuccess: async () => {
        toast.success("Commitment cancelled");
        await invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  if (packageQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading subscription package…
      </div>
    );
  }

  if (packageQuery.isError || !packageQuery.data?.investment) {
    return (
      <div className="rounded-lg border border-destructive/30 p-6 text-sm text-destructive">
        Unable to load closing package.
      </div>
    );
  }

  const { investment, documents, events } = packageQuery.data;
  const released = RELEASED_STATUSES.includes(investment.status);
  const canCancel =
    investment.status === "draft" || investment.status === "pending_documents";

  const handleDownload = async (documentId: string) => {
    try {
      const result = await queryClient.fetchQuery(
        trpc.subscriptionClosing.getDownloadUrl.queryOptions({
          documentId,
          investmentId,
          kind: "pdf",
        }),
      );
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Download failed",
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Subscription Closing</h3>
          <p className="text-sm text-muted-foreground">
            {investment.entityName ?? "Investor"} ·{" "}
            {formatMoney(investment.committedAmount)}
          </p>
        </div>
        <InvestmentStatusChip status={investment.status} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Timeline</h4>
          <ClosingTimeline status={investment.status} />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Audit</h4>
          <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
            {(events ?? []).slice(0, 20).map((event) => (
              <li
                key={event.id}
                className="flex justify-between gap-3 border-b border-border/60 py-2"
              >
                <span className="text-foreground">
                  {event.eventType.replaceAll("_", " ")}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {event.createdAt
                    ? new Date(event.createdAt).toLocaleString()
                    : "—"}
                </span>
              </li>
            ))}
            {(events ?? []).length === 0 ? (
              <li className="text-muted-foreground">No events yet</li>
            ) : null}
          </ul>
        </div>
      </div>

      {released ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Documents</h4>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const canSign =
                    !isAdmin &&
                    doc.signatureRequired &&
                    doc.status === "sent" &&
                    investment.status === "awaiting_signature";
                  const canDownload = Boolean(doc.pdfPath);
                  const signingUrl = doc.signingUrl ?? null;

                  return (
                    <TableRow key={doc.id}>
                      <TableCell>{documentTypeLabel(doc.documentType)}</TableCell>
                      <TableCell>
                        <DocumentStatusChip status={doc.status} />
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        {canDownload ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc.id)}
                          >
                            Download
                          </Button>
                        ) : null}
                        {canSign ? (
                          signingUrl ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                window.open(
                                  signingUrl,
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }
                            >
                              Review &amp; Sign
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={signMutation.isPending}
                              onClick={() =>
                                signMutation.mutate({ documentId: doc.id })
                              }
                            >
                              Sign
                            </Button>
                          )
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      Documents will appear after generation.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Subscription Package</h4>
          <div className="rounded-lg border border-border/60 bg-muted/40 p-6">
            <p className="text-sm font-medium text-foreground">
              {investment.status === "documents_generated"
                ? "Subscription package prepared"
                : "Preparing subscription package"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {investment.status === "documents_generated"
                ? "Waiting for the General Partner to release your subscription documents."
                : "Your subscription documents are being prepared by the General Partner. You'll receive an email as soon as they're available for review and signature."}
            </p>
          </div>
        </div>
      )}

      {canCancel && !isAdmin ? (
        <Button
          variant="outline"
          disabled={cancelMutation.isPending}
          onClick={() =>
            cancelMutation.mutate({
              investmentId,
              reason: "Cancelled by investor",
            })
          }
        >
          Cancel Commitment
        </Button>
      ) : null}
    </div>
  );
}
