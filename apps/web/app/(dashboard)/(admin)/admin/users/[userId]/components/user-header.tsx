import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getKycStatusBadge } from "./utils";
import { OnboardingStatusToggle } from "./onboarding-status-toggle";

interface UserHeaderProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string | null;
    banned: boolean | null;
    kycStatus: string | null;
  };
  onboarding?: {
    id: string;
    status: string | null;
  } | null;
}

export function UserHeader({ user, onboarding }: UserHeaderProps) {
  const isAdminUser = user.role === "admin";
  const isBanned = user.banned ?? false;

  return (
    <div className="flex items-center justify-between pb-4 border-b">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={user.image || undefined}
            alt={user.name || user.email}
          />
          <AvatarFallback className="text-base">
            {user.name
              ? user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : user.email?.[0].toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">
            {user.name || "Unknown User"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isAdminUser ? "default" : "secondary"}>
              {isAdminUser ? "Admin" : "User"}
            </Badge>
            {isBanned && <Badge variant="destructive">Banned</Badge>}
            {getKycStatusBadge(user.kycStatus)}
          </div>
        </div>
      </div>
      {!isAdminUser && onboarding && (
        <OnboardingStatusToggle
          onboardingId={onboarding.id}
          currentStatus={
            onboarding.status as
              | "draft"
              | "submitted"
              | "under_review"
              | "approved"
              | "rejected"
              | "needs_more_info"
              | null
          }
        />
      )}
    </div>
  );
}
