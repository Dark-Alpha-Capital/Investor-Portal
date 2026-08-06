// Email job types for async side-effect / workflow dispatch
export type EmailJobType =
  | "auth-email"
  | "onboarding-investor-confirmation"
  | "onboarding-admin-notification"
  | "knowledge-request-admin"
  | "knowledge-request-answered"
  | "closing-commitment-created"
  | "closing-package-sent"
  | "closing-documents-executed"
  | "closing-funds-received";

export interface BaseEmailJobData {
  type: EmailJobType;
  to: string;
}

/** Raw auth email (verification / password reset) carrying subject + html. */
export interface AuthEmailJobData extends BaseEmailJobData {
  type: "auth-email";
  subject: string;
  html: string;
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

export interface ClosingCommitmentCreatedJobData extends BaseEmailJobData {
  type: "closing-commitment-created";
  investorName: string;
  investorEmail: string;
  dealName: string;
  committedAmount: string;
}

export interface ClosingPackageSentJobData extends BaseEmailJobData {
  type: "closing-package-sent";
  investorName: string;
  dealName: string;
  documents: Array<{ documentName: string; signingUrl: string }>;
  wireInstructionsUrl?: string | null;
  dealUrl: string;
}

export interface ClosingDocumentsExecutedJobData extends BaseEmailJobData {
  type: "closing-documents-executed";
  investorName: string;
  dealName: string;
}

export interface ClosingFundsReceivedJobData extends BaseEmailJobData {
  type: "closing-funds-received";
  investorName: string;
  dealName: string;
  committedAmount: string;
}

export type EmailJobData =
  | AuthEmailJobData
  | OnboardingInvestorConfirmationJobData
  | OnboardingAdminNotificationJobData
  | KnowledgeRequestAdminJobData
  | KnowledgeRequestAnsweredJobData
  | ClosingCommitmentCreatedJobData
  | ClosingPackageSentJobData
  | ClosingDocumentsExecutedJobData
  | ClosingFundsReceivedJobData;

// Email configuration
export const EMAIL_CONFIG = {
  from: "DARK ALPHA CAPITAL <investors@darkalphacapital.com>",
  defaultAdminEmail: "admin@darkalphacapital.com",
} as const;
