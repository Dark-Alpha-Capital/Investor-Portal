import type { Metadata } from "next";
import "@/app/globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { montserrat, raleway, fira_code } from "@/app/fonts";
import { TRPCReactProvider } from "@/trpc/client";
import { generatePageMetadata, generateOrganizationJsonLd, siteConfig } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = generatePageMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: [
    "private equity",
    "venture capital",
    "accredited investor",
    "investment platform",
    "alternative investments",
    "DarkAlpha Capital",
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = generateOrganizationJsonLd();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd data={organizationJsonLd} />
      </head>
      <body
        className={`${montserrat.variable} ${raleway.variable} ${fira_code.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
