import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "sonner";
import { DashboardSidebar } from "@/components/dashboard-siderbar";
import { DashboardProviders } from "@/components/dashboard-providers";
import { SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { generateNoIndexMetadata } from "@/lib/seo";
import { fontSans, fontMono } from "@/app/fonts";

export const metadata: Metadata = generateNoIndexMetadata(
  "Investor Dashboard | DarkAlpha Capital",
);

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <DashboardProviders>
          <DashboardSidebar />
          <SidebarInset>
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
              <SidebarTrigger className="text-muted-foreground" />
            </header>
            <main className="flex-1 transition-all duration-150 ease-out">
              {children}
            </main>
          </SidebarInset>
        </DashboardProviders>
        <Toaster />
      </body>
    </html>
  );
}
