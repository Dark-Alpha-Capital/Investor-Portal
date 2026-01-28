import React, { Suspense } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { SidebarUserNav } from "./sidebar-user-nav";
import { DashboardNavLinks } from "./dashboard-nav-links";
import { DashboardSidebarSkeleton } from "./skeleton/dashboard-sidebar-skeleton";
import { authSession } from "@/app/(auth)/auth";

async function DashboardSidebarContent() {
  const session = await authSession();

  return (
    <>
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
