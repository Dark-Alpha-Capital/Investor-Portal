import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCReactProvider } from "@/trpc/client";

export function ChatbotProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider defaultOpen>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
