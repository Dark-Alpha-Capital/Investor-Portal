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

export interface TicketResolvedProps {
  ticketId: string;
  subject: string;
  investorName: string;
  resolution: string;
  resolvedBy: string;
}

export const TicketResolved = ({
  ticketId,
  subject,
  investorName,
  resolution,
  resolvedBy,
}: TicketResolvedProps) => {
  return (
    <Html>
      <Head />
      <Preview>Ticket Resolved: {subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Your Ticket Has Been Resolved</Heading>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {investorName},</Text>
            <Text style={paragraph}>
              Great news! Your support ticket has been resolved by our team.
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
                <Column style={detailLabel}>Resolved By:</Column>
                <Column style={detailValue}>{resolvedBy}</Column>
              </Row>
            </Section>
            <Section style={resolutionBox}>
              <Heading as="h3" style={resolutionTitle}>
                Resolution
              </Heading>
              <Text style={resolutionText}>{resolution}</Text>
            </Section>
            <Text style={paragraph}>
              If you have any follow-up questions or if this issue is not fully
              resolved, you can add a comment to this ticket by logging into your
              investor portal and visiting the Support section.
            </Text>
            <Text style={paragraph}>
              Thank you for your patience.
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

export default TicketResolved;

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
  backgroundColor: "#22c55e",
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

const resolutionBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
  borderLeft: "4px solid #22c55e",
};

const resolutionTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#166534",
  marginBottom: "12px",
  marginTop: "0",
};

const resolutionText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#166534",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
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
