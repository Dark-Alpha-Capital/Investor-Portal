import { Resend } from "resend";
import { render } from "@react-email/components";
import {
  OnboardingInvestorConfirmation,
  OnboardingAdminNotification,
  KnowledgeRequestAdmin,
  KnowledgeRequestAnswered,
  ClosingCommitmentCreated,
  ClosingPackageSent,
  ClosingDocumentsExecuted,
  ClosingFundsReceived,
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

/**
 * Render an email template based on job data
 * Returns the subject and HTML content
 */
export const renderEmailTemplate = async (
  jobData: EmailJobData
): Promise<{ subject: string; html: string }> => {
  switch (jobData.type) {
    case "auth-email": {
      return { subject: jobData.subject, html: jobData.html };
    }

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

    case "knowledge-request-admin": {
      const subject = `New deal question ${jobData.referenceCode}: ${jobData.dealName}`;
      const html = await render(
        KnowledgeRequestAdmin({
          dealName: jobData.dealName,
          investorName: jobData.investorName,
          investorEmail: jobData.investorEmail,
          referenceCode: jobData.referenceCode,
          title: jobData.title,
          question: jobData.question,
          adminUrl: jobData.adminUrl,
        })
      );
      return { subject, html };
    }

    case "knowledge-request-answered": {
      const subject = `Your question about ${jobData.dealName} has been answered`;
      const html = await render(
        KnowledgeRequestAnswered({
          investorName: jobData.investorName,
          dealName: jobData.dealName,
          referenceCode: jobData.referenceCode,
          title: jobData.title,
          answerPreview: jobData.answerPreview,
          chatUrl: jobData.chatUrl,
        })
      );
      return { subject, html };
    }

    case "closing-commitment-created": {
      const subject = `New capital commitment for ${jobData.dealName}`;
      const html = await render(
        ClosingCommitmentCreated({
          investorName: jobData.investorName,
          investorEmail: jobData.investorEmail,
          dealName: jobData.dealName,
          committedAmount: jobData.committedAmount,
        })
      );
      return { subject, html };
    }

    case "closing-package-sent": {
      const subject = `Action Required: Subscription Documents for ${jobData.dealName}`;
      const html = await render(
        ClosingPackageSent({
          investorName: jobData.investorName,
          dealName: jobData.dealName,
          documents: jobData.documents,
          wireInstructionsUrl: jobData.wireInstructionsUrl,
          dealUrl: jobData.dealUrl,
        })
      );
      return { subject, html };
    }

    case "closing-documents-executed": {
      const subject = `Your ${jobData.dealName} subscription documents are executed`;
      const html = await render(
        ClosingDocumentsExecuted({
          investorName: jobData.investorName,
          dealName: jobData.dealName,
        })
      );
      return { subject, html };
    }

    case "closing-funds-received": {
      const subject = `Your investment in ${jobData.dealName} has been funded`;
      const html = await render(
        ClosingFundsReceived({
          investorName: jobData.investorName,
          dealName: jobData.dealName,
          committedAmount: jobData.committedAmount,
        })
      );
      return { subject, html };
    }

    default: {
      const _exhaustive: never = jobData;
      throw new Error(`Unknown email type: ${(_exhaustive as EmailJobData).type}`);
    }
  }
};

/**
 * Send an email using Resend.
 *
 * `idempotencyKey` guards against duplicate sends when the queue redelivers a
 * message (at-least-once semantics): the key is stable per outbox row, so a
 * crash-after-send-but-before-ack cannot produce a second email.
 */
export const sendEmail = async (
  resend: Resend,
  to: string,
  subject: string,
  html: string,
  opts?: { idempotencyKey?: string }
) => {
  const response = await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject,
    html,
    ...(opts?.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}),
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
  jobData: EmailJobData,
  opts?: { idempotencyKey?: string }
) => {
  const { subject, html } = await renderEmailTemplate(jobData);
  const result = await sendEmail(resend, jobData.to, subject, html, opts);
  return {
    success: true,
    emailId: result?.id,
    to: jobData.to,
    type: jobData.type,
  };
};
