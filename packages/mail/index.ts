import { Resend } from "resend";
import { render } from "@react-email/components";
import {
  OnboardingInvestorConfirmation,
  OnboardingAdminNotification,
  TicketCreatedAdmin,
  TicketCreatedInvestor,
  TicketAssigned,
  TicketStatusChanged,
  TicketCommentAdded,
  TicketResolved,
} from "./emails";
import type { EmailJobData } from "./types";
import { EMAIL_CONFIG } from "./types";

// Re-export types and emails
export * from "./types";
export * from "./emails";

// Re-export render function for email templates
export { render } from "@react-email/components";

/**
 * Create a Resend client instance
 */
export const createResendClient = (apiKey: string) => {
  return new Resend(apiKey);
};

// Lazy-initialized Resend client for direct email sending
let resendClient: Resend | null = null;

const getResendClient = () => {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

/**
 * Send an email directly using Resend (uses RESEND_API_KEY env var)
 * This is a simple utility for sending emails without a pre-configured client.
 * Useful for auth emails, password resets, verification emails, etc.
 */
export const sendEmailDirect = async (
  to: string,
  subject: string,
  html: string
) => {
  const client = getResendClient();
  const response = await client.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject,
    html,
  });
  return response;
};

/**
 * Render an email template based on job data
 * Returns the subject and HTML content
 */
export const renderEmailTemplate = async (
  jobData: EmailJobData
): Promise<{ subject: string; html: string }> => {
  switch (jobData.type) {
    case "onboarding-investor-confirmation": {
      const subject = "Onboarding Submission Received - Dark Alpha Capital";
      const html = await render(
        OnboardingInvestorConfirmation({
          primaryContactName: jobData.primaryContactName,
          organizationName: jobData.organizationName,
        })
      );
      return { subject, html };
    }

    case "onboarding-admin-notification": {
      const subject = `New Onboarding Submission: ${jobData.organizationName}`;
      const html = await render(
        OnboardingAdminNotification({
          organizationName: jobData.organizationName,
          primaryContactName: jobData.primaryContactName,
          primaryContactEmail: jobData.primaryContactEmail,
          primaryContactPhone: jobData.primaryContactPhone,
          investorType: jobData.investorType,
          capitalProviderType: jobData.capitalProviderType,
          onboardingId: jobData.onboardingId,
          fileCount: jobData.fileCount,
          submittedAt: jobData.submittedAt,
        })
      );
      return { subject, html };
    }

    // Ticket email templates
    case "ticket-created-admin": {
      const subject = `New Support Ticket: ${jobData.subject}`;
      const html = await render(
        TicketCreatedAdmin({
          ticketId: jobData.ticketId,
          subject: jobData.subject,
          category: jobData.category,
          priority: jobData.priority,
          investorName: jobData.investorName,
          investorEmail: jobData.investorEmail,
          description: jobData.description,
          createdAt: jobData.createdAt,
        })
      );
      return { subject, html };
    }

    case "ticket-created-investor": {
      const subject = `Support Ticket Received: ${jobData.subject}`;
      const html = await render(
        TicketCreatedInvestor({
          ticketId: jobData.ticketId,
          subject: jobData.subject,
          category: jobData.category,
          investorName: jobData.investorName,
          createdAt: jobData.createdAt,
        })
      );
      return { subject, html };
    }

    case "ticket-assigned": {
      const subject = `Ticket Assigned: ${jobData.subject}`;
      const html = await render(
        TicketAssigned({
          ticketId: jobData.ticketId,
          subject: jobData.subject,
          category: jobData.category,
          priority: jobData.priority,
          investorName: jobData.investorName,
          investorEmail: jobData.investorEmail,
          assigneeName: jobData.assigneeName,
          description: jobData.description,
        })
      );
      return { subject, html };
    }

    case "ticket-status-changed": {
      const subject = `Ticket Status Updated: ${jobData.subject}`;
      const html = await render(
        TicketStatusChanged({
          ticketId: jobData.ticketId,
          subject: jobData.subject,
          investorName: jobData.investorName,
          previousStatus: jobData.previousStatus,
          newStatus: jobData.newStatus,
        })
      );
      return { subject, html };
    }

    case "ticket-comment-added": {
      const subject = `New Comment on Ticket: ${jobData.subject}`;
      const html = await render(
        TicketCommentAdded({
          ticketId: jobData.ticketId,
          subject: jobData.subject,
          recipientName: jobData.recipientName,
          commenterName: jobData.commenterName,
          commentContent: jobData.commentContent,
          isAdminComment: jobData.isAdminComment,
        })
      );
      return { subject, html };
    }

    case "ticket-resolved": {
      const subject = `Ticket Resolved: ${jobData.subject}`;
      const html = await render(
        TicketResolved({
          ticketId: jobData.ticketId,
          subject: jobData.subject,
          investorName: jobData.investorName,
          resolution: jobData.resolution,
          resolvedBy: jobData.resolvedBy,
        })
      );
      return { subject, html };
    }

    default:
      throw new Error(`Unknown email type: ${(jobData as EmailJobData).type}`);
  }
};

/**
 * Send an email using Resend
 */
export const sendEmail = async (
  resend: Resend,
  to: string,
  subject: string,
  html: string
) => {
  const response = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject,
    html,
  });

  if (response.error) {
    throw new Error(`Failed to send email: ${response.error.message}`);
  }

  return response.data;
};

/**
 * Process an email job - renders template and sends email
 */
export const processEmailJob = async (
  resend: Resend,
  jobData: EmailJobData
) => {
  const { subject, html } = await renderEmailTemplate(jobData);
  const result = await sendEmail(resend, jobData.to, subject, html);
  return {
    success: true,
    emailId: result?.id,
    to: jobData.to,
    type: jobData.type,
  };
};
