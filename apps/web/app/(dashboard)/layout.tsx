import type { Metadata } from "next";
import { Suspense } from "react";
import "@/app/globals.css";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-siderbar";
import { DashboardSidebarSkeleton } from "@/components/skeleton/dashboard-sidebar-skeleton";
import { ThemeProvider } from "@/components/theme-provider";
import { montserrat, raleway, fira_code } from "@/app/fonts";
import { TRPCReactProvider } from "@/trpc/client";
import { JobTrackingProvider } from "@/contexts/job-tracking-context";
import { generateNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = generateNoIndexMetadata("Investor Dashboard | DarkAlpha Capital");

export default function DashboardLayout({
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
              <JobTrackingProvider>
                <Suspense fallback={<DashboardSidebarSkeleton />}>
                  <DashboardSidebar />
                </Suspense>
                <main className="flex-1">{children}</main>
              </JobTrackingProvider>
            </TRPCReactProvider>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
