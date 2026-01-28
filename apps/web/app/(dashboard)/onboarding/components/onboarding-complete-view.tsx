import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Pencil,
  History,
  ArrowRight,
  Calendar,
} from "lucide-react";

type EditHistoryEntry = {
  id: string;
  fieldName: string;
  fieldLabel: string | null;
  previousValue: string | null;
  newValue: string | null;
  editedAt: Date;
};

type OnboardingCompleteViewProps = {
  onboardingData: {
    id: string;
    submittedAt: Date | null;
    lastEditedAt: Date | null;
    editCount: string | null;
    isEditable: boolean | null;
    organizationName: string | null;
  };
  editHistory: EditHistoryEntry[];
};

export function OnboardingCompleteView({
  onboardingData,
  editHistory,
}: OnboardingCompleteViewProps) {
  const editCount = parseInt(onboardingData.editCount || "0", 10);
  const isEditable = onboardingData.isEditable !== false;

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl space-y-6">
      {/* Status Card */}
      <Card className="border-green-200 dark:border-green-900">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Onboarding Complete</CardTitle>
                <CardDescription className="mt-1">
                  {onboardingData.organizationName || "Your profile"} has been
                  submitted
                </CardDescription>
              </div>
            </div>
            {editCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {editCount} edit{editCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Submission Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {onboardingData.submittedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Submitted:{" "}
                  {format(
                    new Date(onboardingData.submittedAt),
                    "MMM d, yyyy"
                  )}
                </span>
              </div>
            )}
            {onboardingData.lastEditedAt && (
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                <span>
                  Last edited:{" "}
                  {format(
                    new Date(onboardingData.lastEditedAt),
                    "MMM d, yyyy h:mm a"
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {isEditable && (
              <Button asChild>
                <Link href="/onboarding/edit">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Onboarding
                </Link>
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>

          {!isEditable && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
              Editing has been disabled for your onboarding. Please contact
              support if you need to make changes.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit History Card */}
      {editHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Edit History
            </CardTitle>
            <CardDescription>
              Your most recent changes to the onboarding form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-3">
                {editHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {entry.fieldLabel || entry.fieldName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-muted-foreground line-through bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded truncate max-w-[150px]">
                            {entry.previousValue || "(empty)"}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-foreground bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded truncate max-w-[150px] font-medium">
                            {entry.newValue || "(empty)"}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(entry.editedAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {editHistory.length >= 10 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Showing the 10 most recent changes
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
