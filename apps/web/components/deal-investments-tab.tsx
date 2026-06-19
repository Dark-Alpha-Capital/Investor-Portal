
import { InvestmentManagement } from "./deal-investment-management";
import { useRouter } from "@/hooks/use-app-navigation";

type Investment = {
  id: string;
  userId: string;
  committedAmount: string;
  fundedAmount: string | null;
  currentValue: string | null;
  distributions: string | null;
  status: string;
  ownershipPercentage: string | null;
  committedDate: string;
  createdAt: string;
  updatedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type DealInterest = {
  id: string;
  userId: string;
  status: string;
  proposedAmount: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type InvestmentsTabProps = {
  investments: Investment[];
  interests: DealInterest[];
  dealId: string;
};

export function InvestmentsTab({
  investments,
  interests,
  dealId,
}: InvestmentsTabProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <InvestmentManagement
      dealId={dealId}
      investments={investments}
      interests={interests}
      onRefresh={handleRefresh}
    />
  );
}
