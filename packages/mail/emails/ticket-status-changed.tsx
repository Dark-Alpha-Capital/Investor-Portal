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

export interface TicketStatusChangedProps {
  ticketId: string;
  subject: string;
  investorName: string;
  previousStatus: string;
  newStatus: string;
}

export const TicketStatusChanged = ({
  ticketId,
  subject,
  investorName,
  previousStatus,
  newStatus,
}: TicketStatusChangedProps) => {
  return (
    <Html>
      <Head />
      <Preview>Ticket Status Updated: {subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Ticket Status Updated</Heading>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {investorName},</Text>
            <Text style={paragraph}>
              The status of your support ticket has been updated.
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
            </Section>
            <Section style={statusBox}>
              <Row style={statusRow}>
                <Column style={statusColumn}>
                  <Text style={statusLabel}>Previous Status</Text>
                  <Text style={statusValue}>{formatStatus(previousStatus)}</Text>
                </Column>
                <Column style={arrowColumn}>
                  <Text style={arrow}>→</Text>
                </Column>
                <Column style={statusColumn}>
                  <Text style={statusLabel}>New Status</Text>
                  <Text style={{ ...statusValue, color: getStatusColor(newStatus) }}>
                    {formatStatus(newStatus)}
                  </Text>
                </Column>
              </Row>
            </Section>
            <Text style={paragraph}>
              You can view the full details and any updates by logging into your
              investor portal and visiting the Support section.
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

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    pending_user: "Awaiting Your Response",
    resolved: "Resolved",
    closed: "Closed",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    open: "#3b82f6",
    in_progress: "#f59e0b",
    pending_user: "#8b5cf6",
    resolved: "#22c55e",
    closed: "#6b7280",
  };
  return colorMap[status] || "#1a1a2e";
};

export default TicketStatusChanged;

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

const statusBox = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const statusRow = {
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

const statusColumn = {
  textAlign: "center" as const,
  padding: "0 16px",
};

const arrowColumn = {
  textAlign: "center" as const,
  padding: "0 8px",
};

const statusLabel = {
  fontSize: "12px",
  color: "#8898aa",
  marginBottom: "4px",
  textTransform: "uppercase" as const,
};

const statusValue = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a2e",
  margin: "0",
};

const arrow = {
  fontSize: "24px",
  color: "#8898aa",
  margin: "0",
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
