import React, { Suspense } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarUserNav } from "./sidebar-user-nav";
import { DashboardNavLinks } from "./dashboard-nav-links";
import { DashboardSidebarSkeleton } from "./skeleton/dashboard-sidebar-skeleton";
import { authSession } from "@/app/(auth)/auth";

async function DashboardSidebarContent() {
  const session = await authSession();

  return (
    <>
      <SidebarHeader>
        <div className="px-2 py-1">
          <h2 className="font-semibold text-sm tracking-tight truncate group-data-[collapsible=icon]:hidden">
            Investor Portal
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <DashboardNavLinks session={session} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserNav session={session} />
      </SidebarFooter>
    </>
  );
}

export async function DashboardSidebar() {
  return (
    <Sidebar collapsible="icon">
      <Suspense fallback={<DashboardSidebarSkeleton />}>
        <DashboardSidebarContent />
      </Suspense>
    </Sidebar>
  );
}
