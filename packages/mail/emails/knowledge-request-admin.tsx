import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface KnowledgeRequestAdminProps {
  dealName: string;
  investorName: string;
  investorEmail: string;
  referenceCode: string;
  title: string;
  question: string;
  adminUrl: string;
}

export const KnowledgeRequestAdmin = ({
  dealName,
  investorName,
  investorEmail,
  referenceCode,
  title,
  question,
  adminUrl,
}: KnowledgeRequestAdminProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        New deal question {referenceCode} on {dealName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>New Deal Question</Heading>
          </Section>
          <Section style={content}>
            <Text style={paragraph}>
              An investor submitted a knowledge request for{" "}
              <strong>{dealName}</strong>.
            </Text>
            <Text style={paragraph}>
              <strong>Reference:</strong> {referenceCode}
              <br />
              <strong>Investor:</strong> {investorName} ({investorEmail})
              <br />
              <strong>Title:</strong> {title}
            </Text>
            <Text style={paragraph}>
              <strong>Question</strong>
              <br />
              {question}
            </Text>
            <Text style={paragraph}>
              <Link href={adminUrl}>Open questions for this deal</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
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
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const header = {
  padding: "24px",
  backgroundColor: "#0f172a",
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "600" as const,
  margin: "0",
};

const content = {
  padding: "24px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#334155",
  margin: "0 0 16px",
};
