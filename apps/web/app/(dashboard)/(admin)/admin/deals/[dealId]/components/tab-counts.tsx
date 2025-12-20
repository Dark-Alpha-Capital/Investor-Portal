import { caller } from "@/trpc/server";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Target, TrendingUp, FolderOpen } from "lucide-react";

export async function TabCounts({ dealId }: { dealId: string }) {
  const [invitesResult, interestsResult, investmentsResult, filesResult] =
    await Promise.all([
      caller.deals.getInvites({ dealId }),
      caller.deals.getInterests({ dealId }),
      caller.deals.getInvestments({ dealId }),
      caller.deals.getFiles({ dealId }),
    ]);

  return (
    <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
      <TabsTrigger value="overview" className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Overview
      </TabsTrigger>
      <TabsTrigger value="invites" className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Invites
        {invitesResult.invites.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {invitesResult.invites.length}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="interests" className="flex items-center gap-2">
        <Target className="h-4 w-4" />
        Interests
        {interestsResult.interests.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {interestsResult.interests.length}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="investments" className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Investments
        {investmentsResult.investments.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {investmentsResult.investments.length}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="files" className="flex items-center gap-2">
        <FolderOpen className="h-4 w-4" />
        Files
        {filesResult.files.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {filesResult.files.length}
          </Badge>
        )}
      </TabsTrigger>
    </TabsList>
  );
}

