import type {
  ClosingEventType,
  InvestmentClosingStatus,
  SubscriptionDocumentType,
  TransitionActor,
} from "@repo/db/investment-closing";

export type {
  ClosingEventType,
  InvestmentClosingStatus,
  SubscriptionDocumentType,
  TransitionActor,
};

export type TemplateVariables = {
  InvestorName: string;
  EntityName: string;
  CommitmentAmount: string;
  DealName: string;
  ClosingDate: string;
  FundName: string;
  ManagerName: string;
  GeneratedAt: string;
};

export type ClosingActorContext = {
  userId: string;
  role: TransitionActor;
  isAdmin: boolean;
};

export type CreateCommitmentInput = {
  dealId: string;
  userId: string;
  committedAmount: number;
  entityName: string;
  entityType: "individual" | "entity";
  acknowledgementAccepted: boolean;
  committedDate?: Date;
  ownershipPercentage?: number | null;
  expiresAt?: Date | null;
};
