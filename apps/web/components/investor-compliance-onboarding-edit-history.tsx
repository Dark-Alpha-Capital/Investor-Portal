"use client";

import { format } from "date-fns";
import { History, Pencil, ArrowRight, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type EditHistoryEntry = {
  id: string;
  fieldName: string;
  fieldLabel: string | null;
  previousValue: string | null;
  newValue: string | null;
  editedAt: Date;
  userId: string;
};

type OnboardingEditHistoryProps = {
  editHistory: EditHistoryEntry[];
  lastEditedAt: Date | null;
  editCount: string | null;
};

// Group edits by date for better visualization
function groupEditsByDate(edits: EditHistoryEntry[]) {
  const groups: Record<string, EditHistoryEntry[]> = {};

  for (const edit of edits) {
    const dateKey = format(new Date(edit.editedAt), "yyyy-MM-dd");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(edit);
  }

  return Object.entries(groups).map(([date, entries]) => ({
    date,
    displayDate: format(new Date(date), "MMMM d, yyyy"),
    entries,
  }));
}

// Truncate long values for display
function truncateValue(value: string | null, maxLength: number = 50): string {
  if (!value) return "(empty)";
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + "...";
}

export function OnboardingEditHistory({
  editHistory,
  lastEditedAt,
  editCount,
}: OnboardingEditHistoryProps) {
  if (editHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Investor Edit History
          </CardTitle>
          <CardDescription>No edits have been made to the onboarding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Pencil className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>The investor has not made any changes to their onboarding after submission</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedEdits = groupEditsByDate(editHistory);
  const totalEdits = parseInt(editCount || "0", 10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Investor Edit History
            </CardTitle>
            <CardDescription>
              {editHistory.length} field change(s) across {totalEdits} edit session(s)
            </CardDescription>
          </div>
          {lastEditedAt && (
            <div className="text-right text-sm text-muted-foreground">
              <p>Last edited</p>
              <p className="font-medium">
                {format(new Date(lastEditedAt), "MMM d, yyyy h:mm a")}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Alert banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              This investor has modified their onboarding information
            </p>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Review the changes below to ensure compliance requirements are still met.
              Fields marked with changes may require re-verification.
            </p>
          </div>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {groupedEdits.map((group) => (
              <div key={group.date}>
                {/* Date Header */}
                <div className="sticky top-0 bg-background py-2 z-10">
                  <Badge variant="outline" className="text-xs">
                    {group.displayDate}
                  </Badge>
                </div>

                {/* Edits for this date */}
                <div className="space-y-2 mt-2">
                  {group.entries.map((edit) => (
                    <div
                      key={edit.id}
                      className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm flex items-center gap-2">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                            {edit.fieldLabel || edit.fieldName}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-muted-foreground line-through bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded max-w-[200px] truncate inline-block">
                                    {truncateValue(edit.previousValue)}
                                  </span>
                                </TooltipTrigger>
                                {edit.previousValue && edit.previousValue.length > 50 && (
                                  <TooltipContent side="bottom" className="max-w-sm">
                                    <p className="text-xs break-words">{edit.previousValue}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-foreground bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded max-w-[200px] truncate inline-block font-medium">
                                    {truncateValue(edit.newValue)}
                                  </span>
                                </TooltipTrigger>
                                {edit.newValue && edit.newValue.length > 50 && (
                                  <TooltipContent side="bottom" className="max-w-sm">
                                    <p className="text-xs break-words">{edit.newValue}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(edit.editedAt), "h:mm a")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
