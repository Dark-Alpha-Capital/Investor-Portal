import { caller } from "@/trpc/server";
import { UserStatusCard } from "./user-status-card";

type UserStatusCardServerProps = {
  dealId: string;
};

export async function UserStatusCardServer({
  dealId,
}: UserStatusCardServerProps) {
  const result = await caller.deals.getDealForView({ dealId });
  return (
    <UserStatusCard
      userInterest={result.userInterest}
      userInvestment={result.userInvestment}
    />
  );
}

