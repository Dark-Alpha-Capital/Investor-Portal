// Email job types for async side-effect / workflow dispatch
export type EmailJobType =
  | "onboarding-investor-confirmation"
  | "onboarding-admin-notification";

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

export type EmailJobData =
  | OnboardingInvestorConfirmationJobData
  | OnboardingAdminNotificationJobData;

// Email configuration
export const EMAIL_CONFIG = {
  from: "DARK ALPHA CAPITAL <investors@darkalphacapital.com>",
  defaultAdminEmail: "admin@darkalphacapital.com",
} as const;
