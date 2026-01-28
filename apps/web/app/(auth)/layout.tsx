import "@/app/globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { fontSans, fontMono } from "@/app/fonts";
import { TRPCReactProvider } from "@/trpc/client";
import { generateNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = generateNoIndexMetadata(
  "Sign In | DarkAlpha Capital",
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
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
