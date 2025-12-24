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

export interface OnboardingInvestorConfirmationProps {
  primaryContactName: string;
  organizationName: string;
}

export const OnboardingInvestorConfirmation = ({
  primaryContactName,
  organizationName,
}: OnboardingInvestorConfirmationProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Thank you for your onboarding submission - Dark Alpha Capital
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Dark Alpha Capital</Heading>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={contentTitle}>
              Thank You for Your Submission
            </Heading>
            <Text style={paragraph}>Dear {primaryContactName},</Text>
            <Text style={paragraph}>
              We have successfully received your onboarding form submission for{" "}
              <strong>{organizationName}</strong>.
            </Text>
            <Text style={paragraph}>
              Our team is currently reviewing your information and documents.
              This process typically takes 2-3 business days.
            </Text>
            <Text style={paragraph}>
              You will receive another email once your onboarding has been
              reviewed and approved.
            </Text>
            <Text style={paragraph}>
              If you have any questions in the meantime, please don't hesitate
              to reach out to us.
            </Text>
            <Text style={paragraph}>Best regards,</Text>
            <Text style={paragraph}>The Dark Alpha Capital Team</Text>
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

export default OnboardingInvestorConfirmation;

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
