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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type AdminClosingPackagePanelProps = {
  investmentId: string;
  onRefresh?: () => void;
};

export function AdminClosingPackagePanel({
  investmentId,
  onRefresh,
}: AdminClosingPackagePanelProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");

  const packageQuery = useQuery(
    trpc.subscriptionClosing.getPackage.queryOptions({ investmentId }),
  );

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.subscriptionClosing.getPackage.queryKey({ investmentId }),
    });
    onRefresh?.();
  };

  const generateMutation = useMutation(
    trpc.subscriptionClosing.generateDocuments.mutationOptions({
      onSuccess: async () => {
        toast.success("Documents generated");
        await invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const sendMutation = useMutation(
    trpc.subscriptionClosing.sendForSignature.mutationOptions({
      onSuccess: async () => {
        toast.success("Subscription package sent");
        await invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const countersignMutation = useMutation(
    trpc.subscriptionClosing.countersignDocument.mutationOptions({
      onSuccess: async () => {
        toast.success("Countersigned");
        await invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const fundMutation = useMutation(
    trpc.investments.recordFunding.mutationOptions({
      onSuccess: async () => {
        toast.success("Funds recorded");
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

  const rejectMutation = useMutation(
    trpc.subscriptionClosing.reject.mutationOptions({
      onSuccess: async () => {
        toast.success("Commitment rejected");
        await invalidate();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const handlePreview = async (documentId: string) => {
    try {
      const result = await queryClient.fetchQuery(
        trpc.subscriptionClosing.getDownloadUrl.queryOptions({
          documentId,
          investmentId,
          kind: "pdf",
          preview: true,
        }),
      );
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
    }
  };

  if (packageQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading package…</p>;
  }

  if (!packageQuery.data?.investment) {
    return (
      <p className="text-sm text-destructive">
        Unable to load closing package.
      </p>
    );
  }

  const { investment, documents, events } = packageQuery.data;
  const status = investment.status;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{investment.entityName ?? "Investor"}</p>
          <p className="text-sm text-muted-foreground">
            Outstanding: generate docs, collect signatures, record funding
          </p>
        </div>
        <InvestmentStatusChip status={status} />
      </div>

      <ClosingTimeline status={status} />

      <div className="flex flex-wrap gap-2">
        {(status === "pending_documents" ||
          status === "documents_generated" ||
          status === "awaiting_signature") && (
          <Button
            size="sm"
            disabled={generateMutation.isPending}
            onClick={() =>
              generateMutation.mutate({
                investmentId,
                regenerate: status !== "pending_documents",
              })
            }
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : status === "pending_documents" ? (
              "Generate Documents"
            ) : (
              "Regenerate Documents"
            )}
          </Button>
        )}
        {status === "documents_generated" && (
          <Button
            size="sm"
            variant="secondary"
            disabled={sendMutation.isPending}
            onClick={() => sendMutation.mutate({ investmentId })}
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send Subscription Package"
            )}
          </Button>
        )}
        {status === "awaiting_funds" && (
          <Button
            size="sm"
            disabled={fundMutation.isPending}
            onClick={() =>
              fundMutation.mutate({
                investmentId,
                fundedAmount: Number(investment.committedAmount),
              })
            }
          >
            {fundMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording…
              </>
            ) : (
              "Mark Funds Received"
            )}
          </Button>
        )}
        {status !== "cancelled" &&
          status !== "closed" &&
          status !== "rejected" &&
          status !== "funded" && (
            <Button
              size="sm"
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() =>
                cancelMutation.mutate({
                  investmentId,
                  reason: "Cancelled by admin",
                })
              }
            >
              Cancel
            </Button>
          )}
      </div>

      {status === "awaiting_funds" && (
        <div className="space-y-2 rounded-lg border p-3">
          <Textarea
            placeholder="Rejection reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={rejectMutation.isPending}
            onClick={() =>
              rejectMutation.mutate({
                investmentId,
                reason: rejectReason || "Rejected by admin",
              })
            }
          >
            Reject
          </Button>
        </div>
      )}

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
              const gpSigningUrl = doc.gpSigningUrl ?? null;
              return (
                <TableRow key={doc.id}>
                  <TableCell>{documentTypeLabel(doc.documentType)}</TableCell>
                  <TableCell>
                    <DocumentStatusChip status={doc.status} />
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    {doc.pdfPath ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(doc.id)}
                      >
                        Preview
                      </Button>
                    ) : null}
                    {doc.status === "signed" && doc.requiresCountersign ? (
                      gpSigningUrl ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              gpSigningUrl,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                        >
                          GP Signing Link
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={countersignMutation.isPending}
                          onClick={() =>
                            countersignMutation.mutate({ documentId: doc.id })
                          }
                        >
                          Countersign
                        </Button>
                      )
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Audit trail</h4>
        <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
          {(events ?? []).slice(0, 30).map((event) => (
            <li
              key={event.id}
              className="flex justify-between gap-2 border-b py-1"
            >
              <span>{event.eventType.replaceAll("_", " ")}</span>
              <span className="text-xs text-muted-foreground">
                {event.createdAt
                  ? new Date(event.createdAt).toLocaleString()
                  : "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
