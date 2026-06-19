import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarUserNav } from "./sidebar-user-nav";
import { DashboardNavLinks } from "./dashboard-nav-links";
import type { Session } from "@/lib/session-types";

export function DashboardSidebar({ session }: { session: Session }) {
  return (
    <Sidebar collapsible="icon">
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
    </Sidebar>
  );
}
