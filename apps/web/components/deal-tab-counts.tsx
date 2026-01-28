import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Target, TrendingUp, FolderOpen, AlignLeft } from "lucide-react";

type TabCountsProps = {
  invitesCount: number;
  interestsCount: number;
  investmentsCount: number;
  filesCount: number;
};

export function TabCounts({
  invitesCount,
  interestsCount,
  investmentsCount,
  filesCount,
}: TabCountsProps) {
  return (
    <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
      <TabsTrigger value="overview" className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Overview
      </TabsTrigger>
      <TabsTrigger value="description" className="flex items-center gap-2">
        <AlignLeft className="h-4 w-4" />
        Description
      </TabsTrigger>
      <TabsTrigger value="invites" className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Invites
        {invitesCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {invitesCount}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="interests" className="flex items-center gap-2">
        <Target className="h-4 w-4" />
        Interests
        {interestsCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {interestsCount}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="investments" className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Investments
        {investmentsCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {investmentsCount}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="files" className="flex items-center gap-2">
        <FolderOpen className="h-4 w-4" />
        Files
        {filesCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {filesCount}
          </Badge>
        )}
      </TabsTrigger>
    </TabsList>
  );
}

