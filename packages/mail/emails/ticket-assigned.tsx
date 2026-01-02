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

export interface TicketAssignedProps {
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  investorName: string;
  investorEmail: string;
  assigneeName: string;
  description: string;
}

export const TicketAssigned = ({
  ticketId,
  subject,
  category,
  priority,
  investorName,
  investorEmail,
  assigneeName,
  description,
}: TicketAssignedProps) => {
  const priorityColor = {
    low: "#22c55e",
    medium: "#f59e0b",
    high: "#ef4444",
    urgent: "#dc2626",
  }[priority] || "#6b7280";

  return (
    <Html>
      <Head />
      <Preview>Ticket Assigned to You: {subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Ticket Assigned to You</Heading>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {assigneeName},</Text>
            <Text style={paragraph}>
              A support ticket has been assigned to you for handling.
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
                <Column style={detailLabel}>Priority:</Column>
                <Column style={{ ...detailValue, color: priorityColor, fontWeight: "600" }}>
                  {priority.toUpperCase()}
                </Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Investor:</Column>
                <Column style={detailValue}>{investorName}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Email:</Column>
                <Column style={detailValue}>{investorEmail}</Column>
              </Row>
            </Section>
            <Section style={descriptionBox}>
              <Heading as="h3" style={detailsTitle}>
                Description
              </Heading>
              <Text style={descriptionText}>{description}</Text>
            </Section>
            <Text style={paragraph}>
              Please log in to the admin dashboard to respond to this ticket.
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

export default TicketAssigned;

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

const detailsBox = {
  backgroundColor: "#f6f9fc",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const descriptionBox = {
  backgroundColor: "#fefce8",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
  borderLeft: "4px solid #f59e0b",
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

const descriptionText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#525f7f",
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
