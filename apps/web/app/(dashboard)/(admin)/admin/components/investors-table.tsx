import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Ban, Eye } from "lucide-react";
import Link from "next/link";
import { getAllInvestorsWithKycStatus } from "@repo/db/queries";

const getKycStatusBadge = (status: string | null) => {
  const statusConfig: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }
  > = {
    review: { variant: "secondary", label: "Under Review" },
    approved: { variant: "default", label: "Approved" },
    pending_docs: { variant: "outline", label: "Pending Documents" },
    rejected: { variant: "destructive", label: "Rejected" },
  };

  const config = statusConfig[status || "review"] || statusConfig.review;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export async function InvestorsTable() {
  const investors = await getAllInvestorsWithKycStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investors</CardTitle>
        <CardDescription>
          A list of all investors (users) in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {investors.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No investors found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investors.map((user) => {
                const initials =
                  user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U";

                const createdAt = user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A";

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{user.name || "N/A"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive">
                          <Ban className="mr-1 h-3 w-3" />
                          Banned
                        </Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {getKycStatusBadge(user.kycStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.emailVerified ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span className="text-sm text-primary">
                              Verified
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Unverified
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {createdAt}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

