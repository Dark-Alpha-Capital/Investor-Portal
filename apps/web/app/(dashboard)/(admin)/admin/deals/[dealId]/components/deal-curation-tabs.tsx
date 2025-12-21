"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UninvitedInvestorsTab } from "./uninvited-investors-tab";
import { InvitedInvestorsTab } from "./invited-investors-tab";
import { useMemo } from "react";

type Investor = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  kycStatus: string;
  isOnboardingCompleted: boolean;
};

type DealInvite = {
  id: string;
  userId: string;
  curationNote: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    kycStatus: string;
    isOnboardingCompleted: boolean;
  };
};

type DealCurationTabsProps = {
  dealId: string;
  investors: Investor[];
  invites: DealInvite[];
};

export function DealCurationTabs({
  dealId,
  investors,
  invites,
}: DealCurationTabsProps) {
  const invitedUserIds = useMemo(() => {
    return new Set(invites.map((invite) => invite.userId));
  }, [invites]);

  return (
    <Tabs defaultValue="uninvited" className="w-full">
      <TabsList>
        <TabsTrigger value="uninvited">
          Uninvited ({investors.length - invitedUserIds.size})
        </TabsTrigger>
        <TabsTrigger value="invited">
          Invited ({invites.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="uninvited" className="mt-6">
        <UninvitedInvestorsTab
          dealId={dealId}
          investors={investors}
          invitedUserIds={invitedUserIds}
        />
      </TabsContent>
      <TabsContent value="invited" className="mt-6">
        <InvitedInvestorsTab dealId={dealId} invites={invites} />
      </TabsContent>
    </Tabs>
  );
}

