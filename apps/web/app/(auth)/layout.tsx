import "@/app/globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { montserrat, raleway, fira_code } from "@/app/fonts";
import { TRPCReactProvider } from "@/trpc/client";

export const metadata: Metadata = {
  title: "Investors Dark Alpha Capital",
  description: "Investors Dark Alpha Capital",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${raleway.variable} ${fira_code.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
