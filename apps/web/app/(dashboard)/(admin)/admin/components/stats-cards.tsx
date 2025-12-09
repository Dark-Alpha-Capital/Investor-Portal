import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Shield, User, Ban } from "lucide-react";
import { db } from "@repo/db";
import { user } from "@repo/db/schema";
import { eq, ne, or, isNull, sql } from "drizzle-orm";

export async function StatsCards() {
  // Get counts using SQL for better performance
  const [totalUsersResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(user);
  const totalUsers = Number(totalUsersResult?.count || 0);

  const [adminCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(user)
    .where(eq(user.role, "admin"));
  const adminCount = Number(adminCountResult?.count || 0);

  const [investorCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(user)
    .where(or(ne(user.role, "admin"), isNull(user.role)));
  const investorCount = Number(investorCountResult?.count || 0);

  const [verifiedCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(user)
    .where(eq(user.emailVerified, true));
  const verifiedCount = Number(verifiedCountResult?.count || 0);

  const [bannedCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(user)
    .where(eq(user.banned, true));
  const bannedCount = Number(bannedCountResult?.count || 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">Registered users</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Investors</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{investorCount}</div>
          <p className="text-xs text-muted-foreground">Investor accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Administrators</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{adminCount}</div>
          <p className="text-xs text-muted-foreground">Admin accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Verified</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{verifiedCount}</div>
          <p className="text-xs text-muted-foreground">Email verified</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Banned</CardTitle>
          <Ban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{bannedCount}</div>
          <p className="text-xs text-muted-foreground">Banned users</p>
        </CardContent>
      </Card>
    </div>
  );
}
