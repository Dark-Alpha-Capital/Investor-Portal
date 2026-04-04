import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Target } from "lucide-react";
import Link from "next/link";

type Interest = {
  id: string;
  userId: string;
  status: string;
  proposedAmount: string | null;
  createdAt: string;
  updatedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

const interestStatusColors: Record<string, string> = {
  interested: "default",
  soft_committed: "default",
  pass: "destructive",
  meeting_requested: "default",
};

const formatCurrency = (value: string | null | undefined): string => {
  if (!value) return "-";
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function InterestsTab({ interests }: { interests: Interest[] }) {

  return (
    <section className="flex flex-col gap-5 border-y border-border py-5">
      <header className="space-y-1.5">
        <h2 className="flex items-center gap-2 text-base font-semibold leading-none">
          <Target className="h-5 w-5" />
          Interested Investors
        </h2>
        <p className="text-sm text-muted-foreground">
          Investors who have expressed interest in this deal
        </p>
      </header>
      <div>
        {interests.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No investors have expressed interest in this deal yet.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Proposed Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interests.map((interest) => (
                  <TableRow key={interest.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={interest.user.image || undefined}
                          />
                          <AvatarFallback>
                            {interest.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          href={`/admin/compliance/investors/${interest.user.id}`}
                          className="font-medium hover:underline"
                        >
                          {interest.user.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{interest.user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          interestStatusColors[interest.status] as any
                        }
                      >
                        {interest.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(interest.proposedAmount)}
                    </TableCell>
                    <TableCell>{formatDate(interest.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </section>
  );
}

