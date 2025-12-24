import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";

export interface OnboardingAdminNotificationProps {
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

export const OnboardingAdminNotification = ({
  organizationName,
  primaryContactName,
  primaryContactEmail,
  primaryContactPhone,
  investorType,
  capitalProviderType,
  onboardingId,
  fileCount,
  submittedAt,
}: OnboardingAdminNotificationProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Onboarding Submission: {organizationName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>New Onboarding Submission</Heading>
          </Section>
          <Section style={content}>
            <Text style={paragraph}>
              A new investor onboarding form has been submitted and requires
              review.
            </Text>
            <Section style={detailsBox}>
              <Heading as="h3" style={detailsTitle}>
                Submission Details
              </Heading>
              <Row style={detailRow}>
                <Column style={detailLabel}>Organization:</Column>
                <Column style={detailValue}>{organizationName}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Contact Name:</Column>
                <Column style={detailValue}>{primaryContactName}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Contact Email:</Column>
                <Column style={detailValue}>{primaryContactEmail}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Contact Phone:</Column>
                <Column style={detailValue}>{primaryContactPhone}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Investor Type:</Column>
                <Column style={detailValue}>{investorType}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Capital Provider:</Column>
                <Column style={detailValue}>{capitalProviderType}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Onboarding ID:</Column>
                <Column style={detailValue}>{onboardingId}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Files Uploaded:</Column>
                <Column style={detailValue}>{fileCount}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Submitted At:</Column>
                <Column style={detailValue}>{submittedAt}</Column>
              </Row>
            </Section>
            <Text style={paragraph}>
              Please log in to the admin dashboard to review this submission.
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} Dark Alpha Capital. All rights
              reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OnboardingAdminNotification;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden" as const,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
};

const header = {
  backgroundColor: "#1a1a2e",
  padding: "24px",
  textAlign: "center" as const,
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0",
};

const content = {
  padding: "32px 24px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525f7f",
  marginBottom: "16px",
};

const detailsBox = {
  backgroundColor: "#f6f9fc",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const detailsTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a2e",
  marginBottom: "16px",
  marginTop: "0",
};

const detailRow = {
  marginBottom: "8px",
};

const detailLabel = {
  fontSize: "13px",
  color: "#8898aa",
  width: "140px",
  fontWeight: "500",
};

const detailValue = {
  fontSize: "13px",
  color: "#1a1a2e",
  fontWeight: "400",
};

const footer = {
  backgroundColor: "#f6f9fc",
  padding: "24px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#8898aa",
  margin: "0",
};
