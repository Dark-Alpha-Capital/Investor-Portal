import { CheckCircle2, Shield, User, Ban } from "lucide-react";

export type AdminStatsPayload = {
  totalUsers: number;
  adminCount: number;
  investorCount: number;
  verifiedCount: number;
  bannedCount: number;
};

export function AdminStatsCards({ stats }: { stats: AdminStatsPayload }) {
  const {
    totalUsers,
    adminCount,
    investorCount,
    verifiedCount,
    bannedCount,
  } = stats;

  return (
    <div className="grid gap-6 border-y border-border py-5 md:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <p className="text-sm font-medium">Total Users</p>
          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{totalUsers}</p>
        <p className="text-xs text-muted-foreground">Registered users</p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <p className="text-sm font-medium">Investors</p>
          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{investorCount}</p>
        <p className="text-xs text-muted-foreground">Investor accounts</p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <p className="text-sm font-medium">Administrators</p>
          <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{adminCount}</p>
        <p className="text-xs text-muted-foreground">Admin accounts</p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <p className="text-sm font-medium">Verified</p>
          <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{verifiedCount}</p>
        <p className="text-xs text-muted-foreground">Email verified</p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <p className="text-sm font-medium">Banned</p>
          <Ban className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{bannedCount}</p>
        <p className="text-xs text-muted-foreground">Banned users</p>
      </div>
    </div>
  );
}
