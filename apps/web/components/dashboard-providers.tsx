"use client";

import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCReactProvider } from "@/trpc/client";
import { JobTrackingProvider } from "@/contexts/job-tracking-context";

interface DashboardProvidersProps {
  children: ReactNode;
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <TRPCReactProvider>
          <JobTrackingProvider>{children}</JobTrackingProvider>
        </TRPCReactProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
