import type { TemplateVariables } from "./types";

export type VariableSource = {
  investorName: string;
  entityName: string;
  committedAmount: number;
  dealName: string;
  fundName?: string | null;
  managerName?: string | null;
  closingDate?: Date | null;
  generatedAt?: Date;
};

export function formatCommitmentAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function resolveTemplateVariables(
  source: VariableSource
): TemplateVariables {
  const generatedAt = source.generatedAt ?? new Date();
  const closingDate = source.closingDate ?? generatedAt;
  return {
    InvestorName: source.investorName,
    EntityName: source.entityName,
    CommitmentAmount: formatCommitmentAmount(source.committedAmount),
    DealName: source.dealName,
    ClosingDate: closingDate.toISOString().slice(0, 10),
    FundName: source.fundName?.trim() || source.dealName,
    ManagerName: source.managerName?.trim() || "Dark Alpha Capital",
    GeneratedAt: generatedAt.toISOString(),
  };
}
