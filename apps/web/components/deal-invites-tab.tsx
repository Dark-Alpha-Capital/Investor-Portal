import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AppLink as Link } from "@/components/app-link";

type Invite = {
  id: string;
  userId: string;
  accessLevel: "teaser" | "data_room";
  notes: string | null;
  grantedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    isOnboardingCompleted: boolean;
  };
};

const ACCESS_LABELS: Record<Invite["accessLevel"], string> = {
  teaser: "Teaser",
  data_room: "Data Room",
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function InvitesTab({ invites }: { invites: Invite[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Invited Investors</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Investors granted access via Compliance
        </p>
      </div>

      {invites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No investors have been invited to this deal yet. Invite them from
            Compliance.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Investor</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Access</TableHead>
                <TableHead className="font-medium">Notes</TableHead>
                <TableHead className="font-medium">Invited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow
                  key={invite.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={invite.user.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {invite.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Link
                        href={`/admin/compliance/investors/${invite.user.id}`}
                        className="font-medium hover:underline"
                      >
                        {invite.user.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invite.user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ACCESS_LABELS[invite.accessLevel]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {invite.notes ? (
                      <span className="text-sm">{invite.notes}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(invite.grantedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
