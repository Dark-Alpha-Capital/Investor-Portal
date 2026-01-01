import { InvestmentsTab } from "./investments-tab";

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

export function InvestmentsTabWrapper({
  dealId,
  investments,
  interests,
}: {
  dealId: string;
  investments: Investment[];
  interests: Interest[];
}) {
  return (
    <InvestmentsTab
      investments={investments}
      interests={interests}
      dealId={dealId}
    />
  );
}
