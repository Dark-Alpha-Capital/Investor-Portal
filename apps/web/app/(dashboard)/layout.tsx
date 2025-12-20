import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-siderbar";
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
          <SidebarProvider>
            <TRPCReactProvider>
              <DashboardSidebar />
              <main className="flex-1">{children}</main>
            </TRPCReactProvider>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
