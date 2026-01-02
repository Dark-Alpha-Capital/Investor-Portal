"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { ClearanceStatus } from "@/lib/permissions";

type ClearanceStatusCardProps = {
  status: ClearanceStatus | null;
  conditions: string[] | null;
  isOnboardingCompleted: boolean;
};

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending Review",
    description: "Your application is being reviewed by our compliance team.",
    variant: "secondary" as const,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
  cleared: {
    icon: ShieldCheck,
    label: "Cleared",
    description: "You have full access to the investor portal.",
    variant: "default" as const,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  cleared_with_conditions: {
    icon: ShieldAlert,
    label: "Cleared with Conditions",
    description: "You have access with certain restrictions.",
    variant: "outline" as const,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    description: "Your application was not approved.",
    variant: "destructive" as const,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
} as const;

export function ClearanceStatusCard({
  status,
  conditions,
  isOnboardingCompleted,
}: ClearanceStatusCardProps) {
  // If onboarding not completed, show onboarding prompt
  if (!isOnboardingCompleted) {
    return (
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Complete Your Onboarding</CardTitle>
          </div>
          <CardDescription>
            Finish your investor profile to access deal opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Complete the onboarding process to gain access to the deal
            marketplace and investment opportunities.
          </p>
          <Button asChild>
            <Link href="/onboarding">
              Continue Onboarding
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If no clearance record exists yet, show pending by default
  const currentStatus = status ?? "pending";
  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  return (
    <Card className={`border-l-4 ${config.bgColor}`} style={{ borderLeftColor: "currentColor" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
            <CardTitle className="text-lg">Clearance Status</CardTitle>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status-specific content */}
        {currentStatus === "pending" && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Our compliance team typically reviews applications within 2-3
              business days. You&apos;ll receive an email notification once your
              status is updated.
            </AlertDescription>
          </Alert>
        )}

        {currentStatus === "cleared" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You have full access to:
            </p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Deal marketplace and documents
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Investment opportunities
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Portfolio management
              </li>
            </ul>
          </div>
        )}

        {currentStatus === "cleared_with_conditions" && conditions && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Active Conditions:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              {conditions.map((condition, index) => (
                <li key={index}>{condition}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Contact support if you have questions about these conditions.
            </p>
          </div>
        )}

        {currentStatus === "rejected" && (
          <div className="space-y-3">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Your application did not meet our compliance requirements.
                Please contact our compliance team for more information.
              </AlertDescription>
            </Alert>
            <Button variant="outline" asChild>
              <Link href="/support">Contact Support</Link>
            </Button>
          </div>
        )}

        {/* What you can access section for non-cleared users */}
        {(currentStatus === "pending" || currentStatus === "rejected") && (
          <div className="pt-3 border-t">
            <p className="text-sm font-medium mb-2">Current Access:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                View deal marketplace (names only)
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="line-through">Download deal documents</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="line-through">Express investment interest</span>
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
