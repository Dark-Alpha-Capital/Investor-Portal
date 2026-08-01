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

export interface KnowledgeRequestAnsweredProps {
  investorName: string;
  dealName: string;
  referenceCode: string;
  title: string;
  answerPreview: string;
  chatUrl: string;
}

export const KnowledgeRequestAnswered = ({
  investorName,
  dealName,
  referenceCode,
  title,
  answerPreview,
  chatUrl,
}: KnowledgeRequestAnsweredProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Your question about {dealName} has been answered ({referenceCode})
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Dark Alpha Capital</Heading>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={contentTitle}>
              Your question has been answered
            </Heading>
            <Text style={paragraph}>Dear {investorName},</Text>
            <Text style={paragraph}>
              The deal team answered your question about{" "}
              <strong>{dealName}</strong> ({referenceCode}):{" "}
              <strong>{title}</strong>
            </Text>
            <Text style={paragraph}>{answerPreview}</Text>
            <Text style={paragraph}>
              <Link href={chatUrl}>View the answer in chat</Link>
            </Text>
            <Text style={paragraph}>Best regards,</Text>
            <Text style={paragraph}>The Dark Alpha Capital Team</Text>
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

const contentTitle = {
  fontSize: "18px",
  fontWeight: "600" as const,
  color: "#0f172a",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#334155",
  margin: "0 0 16px",
};
