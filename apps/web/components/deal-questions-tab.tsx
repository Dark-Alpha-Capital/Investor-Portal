"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/hooks/use-app-navigation";
import type { AdminDealDetailPayload } from "@/lib/server-fns/admin-route-data";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DealQuestionsTabProps = {
  dealId: string;
  questions: AdminDealDetailPayload["questions"];
};

export function DealQuestionsTab({ dealId, questions }: DealQuestionsTabProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"open" | "answered" | "all">(
    "all",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  const requests =
    statusFilter === "all"
      ? questions
      : questions.filter((r) => r.status === statusFilter);
  const selected =
    requests.find((r) => r.id === selectedId) ?? requests[0] ?? null;

  const refresh = () => {
    router.refresh();
  };

  const publishMutation = useMutation(
    trpc.knowledgeRequests.publishAnswer.mutationOptions({
      onSuccess: () => {
        toast.success("Answer published");
        setAnswer("");
        refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to publish answer");
      },
    }),
  );

  const draftMutation = useMutation(
    trpc.knowledgeRequests.generateDraft.mutationOptions({
      onSuccess: (data) => {
        setAnswer(data.draft);
        toast.success("Draft generated from deal knowledge");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate draft");
      },
    }),
  );

  const closeMutation = useMutation(
    trpc.knowledgeRequests.close.mutationOptions({
      onSuccess: () => {
        toast.success("Question closed");
        refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to close question");
      },
    }),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["open", "answered", "all"] as const).map((value) => (
            <Button
              key={value}
              onClick={() => {
                setStatusFilter(value);
                setSelectedId(null);
              }}
              size="sm"
              type="button"
              variant={statusFilter === value ? "default" : "outline"}
            >
              {value === "all" ? "All" : value === "open" ? "Open" : "Answered"}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {requests.length === 0 ? (
            <p className="rounded-lg border px-3 py-6 text-center text-sm text-muted-foreground">
              No questions in this filter.
            </p>
          ) : (
            requests.map((request) => {
              const active = (selected?.id ?? null) === request.id;
              return (
                <button
                  className={cn(
                    "w-full rounded-lg border px-3 py-3 text-left transition-colors hover:bg-muted/50",
                    active && "border-primary bg-primary/5",
                  )}
                  key={request.id}
                  onClick={() => {
                    setSelectedId(request.id);
                    setAnswer("");
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {request.referenceCode}
                    </span>
                    <Badge variant="secondary">{request.status}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-medium">
                    {request.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.askerName} ·{" "}
                    {formatDistanceToNow(new Date(request.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="min-h-[280px] rounded-lg border p-4">
        {!selected ? (
          <p className="text-sm text-muted-foreground">
            Select a question to review and answer.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {selected.referenceCode}
                </p>
                <h3 className="text-lg font-semibold">{selected.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.askerName} ({selected.askerEmail}) · asked{" "}
                  {formatDistanceToNow(new Date(selected.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <Badge>{selected.status}</Badge>
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
              {selected.question}
            </div>

            {selected.status === "answered" && selected.answer ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Published answer</h4>
                <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">
                  {selected.answer}
                </div>
              </div>
            ) : null}

            {selected.status === "open" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium">Answer</h4>
                  <Button
                    disabled={draftMutation.isPending}
                    onClick={() =>
                      draftMutation.mutate({
                        dealId,
                        question: selected.question,
                      })
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {draftMutation.isPending
                      ? "Generating…"
                      : "Generate draft"}
                  </Button>
                </div>
                <Textarea
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Write a verified answer for future investors…"
                  rows={8}
                  value={answer}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={
                      !answer.trim() ||
                      publishMutation.isPending ||
                      closeMutation.isPending
                    }
                    onClick={() =>
                      publishMutation.mutate({
                        requestId: selected.id,
                        answer: answer.trim(),
                      })
                    }
                    type="button"
                  >
                    {publishMutation.isPending ? "Publishing…" : "Publish"}
                  </Button>
                  <Button
                    disabled={
                      publishMutation.isPending || closeMutation.isPending
                    }
                    onClick={() =>
                      closeMutation.mutate({ requestId: selected.id })
                    }
                    type="button"
                    variant="outline"
                  >
                    Close without answer
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
