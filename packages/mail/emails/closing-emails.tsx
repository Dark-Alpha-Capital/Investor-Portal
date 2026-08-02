import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface ClosingPackageSentProps {
  investorName: string;
  dealName: string;
  documents: Array<{ documentName: string; signingUrl: string }>;
}

export interface ClosingDocumentsExecutedProps {
  investorName: string;
  dealName: string;
}

export interface ClosingFundsReceivedProps {
  investorName: string;
  dealName: string;
  committedAmount: string;
}

function Layout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Dark Alpha Capital</Heading>
          </Section>
          <Section style={content}>{children}</Section>
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
}

export const ClosingPackageSent = ({
  investorName,
  dealName,
  documents,
}: ClosingPackageSentProps) => {
  return (
    <Layout preview={`Action Required: Subscription Documents for ${dealName}`}>
      <Heading as="h2" style={contentTitle}>
        Action Required: Subscription Documents
      </Heading>
      <Text style={paragraph}>Dear {investorName},</Text>
      <Text style={paragraph}>
        Your subscription package for <strong>{dealName}</strong> is now ready.
        Please review and sign each document below.
      </Text>
      {documents.length > 0 ? (
        <Section style={docList}>
          {documents.map((doc) => (
            <Text key={doc.signingUrl} style={docItem}>
              &bull; <strong>{doc.documentName}</strong> —{" "}
              <a href={doc.signingUrl} target="_blank" rel="noreferrer">
                Review &amp; Sign
              </a>
            </Text>
          ))}
        </Section>
      ) : null}
      <Text style={paragraph}>Best regards,</Text>
      <Text style={paragraph}>The Dark Alpha Capital Team</Text>
    </Layout>
  );
};

export const ClosingDocumentsExecuted = ({
  investorName,
  dealName,
}: ClosingDocumentsExecutedProps) => {
  return (
    <Layout preview={`Your ${dealName} documents are fully executed`}>
      <Heading as="h2" style={contentTitle}>
        Documents Executed
      </Heading>
      <Text style={paragraph}>Dear {investorName},</Text>
      <Text style={paragraph}>
        All required documents for your investment in{" "}
        <strong>{dealName}</strong> have been fully executed.
      </Text>
      <Text style={paragraph}>
        Wire instructions are now available in the Investor Portal. Please
        complete your funding at your earliest convenience.
      </Text>
      <Text style={paragraph}>Best regards,</Text>
      <Text style={paragraph}>The Dark Alpha Capital Team</Text>
    </Layout>
  );
};

export const ClosingFundsReceived = ({
  investorName,
  dealName,
  committedAmount,
}: ClosingFundsReceivedProps) => {
  return (
    <Layout preview={`Your investment in ${dealName} has been funded`}>
      <Heading as="h2" style={contentTitle}>
        Investment Funded
      </Heading>
      <Text style={paragraph}>Dear {investorName},</Text>
      <Text style={paragraph}>
        We have confirmed receipt of your {committedAmount} commitment for{" "}
        <strong>{dealName}</strong>. Your investment is now funded.
      </Text>
      <Text style={paragraph}>
        You can track this investment from your portfolio in the Investor
        Portal.
      </Text>
      <Text style={paragraph}>Best regards,</Text>
      <Text style={paragraph}>The Dark Alpha Capital Team</Text>
    </Layout>
  );
};

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

const contentTitle = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1a1a2e",
  marginBottom: "24px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525f7f",
  marginBottom: "16px",
};

const docList = {
  marginBottom: "16px",
};

const docItem = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525f7f",
  marginBottom: "8px",
  marginTop: "0",
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
