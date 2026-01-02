import { Suspense } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { SidebarUserNav } from "./sidebar-user-nav";
import { DashboardNavLinks } from "./dashboard-nav-links";

export async function DashboardSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-4">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          }
        >
          <DashboardNavLinks />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
