"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/hooks/use-app-navigation";
import type { AdminDealDetailPayload } from "@/lib/server-fns/admin-route-data";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Sparkles,
  Send,
  Archive,
  CheckCircle2,
  Loader2,
} from "lucide-react";

type DealQuestionsTabProps = {
  dealId: string;
  questions: AdminDealDetailPayload["questions"];
};

type StatusFilter = "all" | "open" | "answered";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
];

const STATUS_META: Record<string, { label: string; dot: string; className: string }> = {
  open: {
    label: "Open",
    dot: "bg-amber-500",
    className:
      "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  answered: {
    label: "Answered",
    dot: "bg-emerald-500",
    className:
      "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  closed: {
    label: "Closed",
    dot: "bg-muted-foreground",
    className: "border-border bg-muted text-muted-foreground",
  },
  archived: {
    label: "Archived",
    dot: "bg-muted-foreground",
    className: "border-border bg-muted text-muted-foreground",
  },
};

export function DealQuestionsTab({ dealId, questions }: DealQuestionsTabProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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

  const openCount = questions.filter((q) => q.status === "open").length;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Investor questions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Answer investor questions to publish verified knowledge to the
            marketplace.
          </p>
        </div>
        <span className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs font-medium tabular-nums text-muted-foreground">
          {openCount} open
        </span>
      </header>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 py-20 text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground">
            <Inbox className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Inbox zero</p>
            <p className="text-sm text-muted-foreground">
              No investor questions yet. New questions will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          {/* Question list */}
          <div className="space-y-3">
            <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
              {FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setStatusFilter(value);
                    setSelectedId(null);
                  }}
                  type="button"
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                  {value !== "all" ? (
                    <span
                      className={cn(
                        "ml-1.5 font-mono text-[10px]",
                        statusFilter === value
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {questions.filter((q) => q.status === value).length}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {requests.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                  No questions in this filter.
                </p>
              ) : (
                requests.map((request) => {
                  const active = (selected?.id ?? null) === request.id;
                  const meta = STATUS_META[request.status] ?? STATUS_META.open;
                  return (
                    <button
                      className={cn(
                        "w-full rounded-lg border px-3.5 py-3 text-left transition-colors",
                        active
                          ? "border-primary/40 bg-primary/[0.04]"
                          : "border-border bg-card hover:bg-muted/50",
                      )}
                      key={request.id}
                      onClick={() => {
                        setSelectedId(request.id);
                        setAnswer("");
                      }}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                          <span
                            className={cn("size-1.5 rounded-full", meta.dot)}
                          />
                          {request.referenceCode}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            meta.className,
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground">
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

          {/* Detail pane */}
          <div className="min-h-[280px]">
            {!selected ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 py-16 text-center">
                <Inbox className="size-8 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  Select a question to review and answer.
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col rounded-lg border border-border bg-card">
                <div className="border-b border-border px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {selected.referenceCode}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight">
                        {selected.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selected.askerName} ({selected.askerEmail}) · asked{" "}
                        {formatDistanceToNow(new Date(selected.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {(() => {
                      const meta =
                        STATUS_META[selected.status] ?? STATUS_META.open;
                      return (
                        <span
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            meta.className,
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", meta.dot)} />
                          {meta.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-6 px-6 py-5">
                  <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Question
                    </p>
                    <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {selected.question}
                    </div>
                  </div>

                  {selected.status === "answered" && selected.answer ? (
                    <div className="space-y-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        Published answer
                      </p>
                      <div className="rounded-lg border border-emerald-600/20 bg-emerald-500/[0.04] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {selected.answer}
                      </div>
                    </div>
                  ) : null}

                  {selected.status === "open" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Draft answer
                        </p>
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
                          {draftMutation.isPending ? (
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="mr-1.5 size-3.5" />
                          )}
                          {draftMutation.isPending ? "Generating…" : "Generate draft"}
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
                          {publishMutation.isPending ? (
                            <Loader2 className="mr-1.5 size-4 animate-spin" />
                          ) : (
                            <Send className="mr-1.5 size-4" />
                          )}
                          {publishMutation.isPending ? "Publishing…" : "Publish answer"}
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
                          <Archive className="mr-1.5 size-4" />
                          Close without answer
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {selected.status === "closed" ||
                  selected.status === "archived" ? (
                    <p className="text-sm text-muted-foreground">
                      This question was closed without a published answer.
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
