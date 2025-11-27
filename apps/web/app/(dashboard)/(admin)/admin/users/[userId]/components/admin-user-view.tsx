import { Shield } from "lucide-react";
import { UserBasicInfo } from "./user-basic-info";

interface AdminUserViewProps {
  user: {
    email: string;
    createdAt: Date | null;
    emailVerified: boolean;
    banned: boolean | null;
    banReason: string | null;
    banExpires: Date | null;
    isOnboardingCompleted: boolean;
  };
}

export function AdminUserView({ user }: AdminUserViewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Admin User Profile</h2>
      </div>
      <UserBasicInfo user={user} />
      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
        Admin users do not have onboarding data as they are internal team
        members.
      </div>
    </div>
  );
}
