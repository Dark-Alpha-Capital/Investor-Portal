import { caller } from "@/trpc/server";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import Link from "next/link";

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export async function InvitesTab({ dealId }: { dealId: string }) {
  const result = await caller.deals.getInvites({ dealId });
  const invites = result.invites;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Invited Investors
        </CardTitle>
        <CardDescription>
          Investors who have been invited to view this deal
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No investors have been invited to this deal yet.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Curation Note</TableHead>
                  <TableHead>Invited</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={invite.user.image || undefined}
                          />
                          <AvatarFallback>
                            {invite.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          href={`/admin/users/${invite.user.id}`}
                          className="font-medium hover:underline"
                        >
                          {invite.user.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{invite.user.email}</TableCell>
                    <TableCell>
                      {invite.curationNote || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(invite.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

