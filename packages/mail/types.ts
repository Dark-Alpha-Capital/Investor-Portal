// Email job types for async side-effect / workflow dispatch
export type EmailJobType =
  | "onboarding-investor-confirmation"
  | "onboarding-admin-notification"
  | "knowledge-request-admin"
  | "knowledge-request-answered";

export interface BaseEmailJobData {
  type: EmailJobType;
  to: string;
}

export interface OnboardingInvestorConfirmationJobData extends BaseEmailJobData {
  type: "onboarding-investor-confirmation";
  primaryContactName: string;
  organizationName: string;
}

export interface OnboardingAdminNotificationJobData extends BaseEmailJobData {
  type: "onboarding-admin-notification";
  organizationName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  investorType: string;
  capitalProviderType: string;
  onboardingId: string;
  fileCount: number;
  submittedAt: string;
}

export interface KnowledgeRequestAdminJobData extends BaseEmailJobData {
  type: "knowledge-request-admin";
  dealName: string;
  investorName: string;
  investorEmail: string;
  referenceCode: string;
  title: string;
  question: string;
  adminUrl: string;
}

export interface KnowledgeRequestAnsweredJobData extends BaseEmailJobData {
  type: "knowledge-request-answered";
  investorName: string;
  dealName: string;
  referenceCode: string;
  title: string;
  answerPreview: string;
  chatUrl: string;
}

export type EmailJobData =
  | OnboardingInvestorConfirmationJobData
  | OnboardingAdminNotificationJobData
  | KnowledgeRequestAdminJobData
  | KnowledgeRequestAnsweredJobData;

// Email configuration
export const EMAIL_CONFIG = {
  from: "DARK ALPHA CAPITAL <investors@darkalphacapital.com>",
  defaultAdminEmail: "admin@darkalphacapital.com",
} as const;
