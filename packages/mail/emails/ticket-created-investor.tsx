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

export interface TicketCreatedInvestorProps {
  ticketId: string;
  subject: string;
  category: string;
  investorName: string;
  createdAt: string;
}

export const TicketCreatedInvestor = ({
  ticketId,
  subject,
  category,
  investorName,
  createdAt,
}: TicketCreatedInvestorProps) => {
  return (
    <Html>
      <Head />
      <Preview>Support Ticket Received: {subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Support Ticket Received</Heading>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {investorName},</Text>
            <Text style={paragraph}>
              Thank you for contacting Dark Alpha Capital support. We have received your
              support ticket and our team will review it shortly.
            </Text>
            <Section style={detailsBox}>
              <Heading as="h3" style={detailsTitle}>
                Ticket Details
              </Heading>
              <Row style={detailRow}>
                <Column style={detailLabel}>Ticket ID:</Column>
                <Column style={detailValue}>{ticketId}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Subject:</Column>
                <Column style={detailValue}>{subject}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Category:</Column>
                <Column style={detailValue}>{formatCategory(category)}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Created:</Column>
                <Column style={detailValue}>{createdAt}</Column>
              </Row>
            </Section>
            <Text style={paragraph}>
              You can track the status of your ticket and add additional comments by
              logging into your investor portal and visiting the Support section.
            </Text>
            <Text style={paragraph}>
              We aim to respond to all support requests within 1-2 business days.
            </Text>
            <Text style={signoff}>
              Best regards,
              <br />
              Dark Alpha Capital Investor Relations
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} Dark Alpha Capital. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const formatCategory = (category: string) => {
  const categoryMap: Record<string, string> = {
    credentials: "Login/Credentials",
    documents: "Documents",
    profile: "Profile Update",
    banking: "Banking Information",
    investment: "Investment Question",
    other: "Other",
  };
  return categoryMap[category] || category;
};

export default TicketCreatedInvestor;

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

const greeting = {
  fontSize: "16px",
  color: "#1a1a2e",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525f7f",
  marginBottom: "16px",
};

const signoff = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525f7f",
  marginTop: "24px",
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
  width: "100px",
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
