import { Mail, Calendar, CheckCircle2, FileCheck, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface UserBasicInfoProps {
  user: {
    email: string;
    createdAt: Date | null;
    emailVerified: boolean;
    isOnboardingCompleted: boolean;
    banned: boolean | null;
    banReason: string | null;
    banExpires: Date | null;
  };
}

export function UserBasicInfo({ user }: UserBasicInfoProps) {
  const infoItems = [
    {
      icon: Mail,
      label: "Email",
      value: user.email,
    },
    {
      icon: Calendar,
      label: "Member Since",
      value: user.createdAt
        ? format(new Date(user.createdAt), "PPP")
        : "N/A",
    },
    {
      icon: CheckCircle2,
      label: "Email Verified",
      value: user.emailVerified ? "Yes" : "No",
    },
    {
      icon: FileCheck,
      label: "Onboarding Completed",
      value: user.isOnboardingCompleted ? "Yes" : "No",
    },
  ];

  if (user.banned ?? false) {
    infoItems.push({
      icon: AlertCircle,
      label: "Ban Reason",
      value: user.banReason || "Not specified",
    });
    if (user.banExpires) {
      infoItems.push({
        icon: Clock,
        label: "Ban Expires",
        value: format(new Date(user.banExpires), "PPP"),
      });
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3">
      {infoItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="flex items-start gap-2">
            <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium truncate">{item.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

