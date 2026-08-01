"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

type ProposeKnowledgeRequestCardProps = {
  chatId: string;
  dealId: string;
  title: string;
  question: string;
};

export function ProposeKnowledgeRequestCard({
  chatId,
  dealId,
  title,
  question,
}: ProposeKnowledgeRequestCardProps) {
  const trpc = useTRPC();
  const [dismissed, setDismissed] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const createMutation = useMutation(
    trpc.knowledgeRequests.create.mutationOptions({
      onSuccess: (data) => {
        setSubmittedRef(data.referenceCode);
        toast.success(`Question submitted — ${data.referenceCode}`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to submit question");
      },
    }),
  );

  if (dismissed) {
    return (
      <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        Question not submitted.
      </div>
    );
  }

  if (submittedRef) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-900 dark:text-emerald-100">
              Question submitted.
            </p>
            <p className="mt-1 text-emerald-800 dark:text-emerald-200">
              You&apos;ll be notified when it&apos;s answered. Reference{" "}
              <span className="font-mono">{submittedRef}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card px-3 py-3 text-sm">
      <div>
        <p className="font-medium">Submit to deal team?</p>
        <p className="mt-1 text-muted-foreground">{title}</p>
        <p className="mt-2 whitespace-pre-wrap">{question}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={createMutation.isPending}
          onClick={() =>
            createMutation.mutate({
              dealId,
              chatId,
              title,
              question,
            })
          }
          size="sm"
          type="button"
        >
          {createMutation.isPending ? "Submitting…" : "Submit Question"}
        </Button>
        <Button
          disabled={createMutation.isPending}
          onClick={() => setDismissed(true)}
          size="sm"
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
