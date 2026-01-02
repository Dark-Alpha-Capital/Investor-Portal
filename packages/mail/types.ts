// Email job types for BullMQ queue
export type EmailJobType =
  | "onboarding-investor-confirmation"
  | "onboarding-admin-notification"
  | "ticket-created-admin"
  | "ticket-created-investor"
  | "ticket-assigned"
  | "ticket-status-changed"
  | "ticket-comment-added"
  | "ticket-resolved";

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

// Ticket email job data types
export interface TicketCreatedAdminJobData extends BaseEmailJobData {
  type: "ticket-created-admin";
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  investorName: string;
  investorEmail: string;
  description: string;
  createdAt: string;
}

export interface TicketCreatedInvestorJobData extends BaseEmailJobData {
  type: "ticket-created-investor";
  ticketId: string;
  subject: string;
  category: string;
  investorName: string;
  createdAt: string;
}

export interface TicketAssignedJobData extends BaseEmailJobData {
  type: "ticket-assigned";
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  investorName: string;
  investorEmail: string;
  assigneeName: string;
  description: string;
}

export interface TicketStatusChangedJobData extends BaseEmailJobData {
  type: "ticket-status-changed";
  ticketId: string;
  subject: string;
  investorName: string;
  previousStatus: string;
  newStatus: string;
}

export interface TicketCommentAddedJobData extends BaseEmailJobData {
  type: "ticket-comment-added";
  ticketId: string;
  subject: string;
  recipientName: string;
  commenterName: string;
  commentContent: string;
  isAdminComment: boolean;
}

export interface TicketResolvedJobData extends BaseEmailJobData {
  type: "ticket-resolved";
  ticketId: string;
  subject: string;
  investorName: string;
  resolution: string;
  resolvedBy: string;
}

export type EmailJobData =
  | OnboardingInvestorConfirmationJobData
  | OnboardingAdminNotificationJobData
  | TicketCreatedAdminJobData
  | TicketCreatedInvestorJobData
  | TicketAssignedJobData
  | TicketStatusChangedJobData
  | TicketCommentAddedJobData
  | TicketResolvedJobData;

// Email configuration
export const EMAIL_CONFIG = {
  from: "DARK ALPHA CAPITAL <investors@darkalphacapital.com>",
  defaultAdminEmail: "admin@darkalphacapital.com",
} as const;
