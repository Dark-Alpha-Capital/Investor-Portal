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

export interface TicketCommentAddedProps {
  ticketId: string;
  subject: string;
  recipientName: string;
  commenterName: string;
  commentContent: string;
  isAdminComment: boolean;
}

export const TicketCommentAdded = ({
  ticketId,
  subject,
  recipientName,
  commenterName,
  commentContent,
  isAdminComment,
}: TicketCommentAddedProps) => {
  const commenterLabel = isAdminComment ? "Support Team" : "Investor";

  return (
    <Html>
      <Head />
      <Preview>New Comment on Ticket: {subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>New Comment on Your Ticket</Heading>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {recipientName},</Text>
            <Text style={paragraph}>
              A new comment has been added to your support ticket.
            </Text>
            <Section style={detailsBox}>
              <Row style={detailRow}>
                <Column style={detailLabel}>Ticket ID:</Column>
                <Column style={detailValue}>{ticketId}</Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabel}>Subject:</Column>
                <Column style={detailValue}>{subject}</Column>
              </Row>
            </Section>
            <Section style={commentBox}>
              <div style={commentHeader}>
                <Text style={commenterNameStyle}>{commenterName}</Text>
                <Text style={commenterRole}>{commenterLabel}</Text>
              </div>
              <Text style={commentText}>{commentContent}</Text>
            </Section>
            <Text style={paragraph}>
              You can reply to this comment by logging into your investor portal
              and visiting the Support section.
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

export default TicketCommentAdded;

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
  padding: "16px 20px",
  marginBottom: "24px",
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

const commentBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
  borderLeft: "4px solid #3b82f6",
};

const commentHeader = {
  marginBottom: "12px",
};

const commenterNameStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1a1a2e",
  margin: "0",
  display: "inline",
};

const commenterRole = {
  fontSize: "12px",
  color: "#8898aa",
  margin: "0 0 0 8px",
  display: "inline",
};

const commentText = {
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
