import {
  Home,
  Shield,
  User,
  Briefcase,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { SidebarUserNav } from "./sidebar-user-nav";
import { authSession } from "@/app/(auth)/auth";

export async function DashboardSidebar() {
  const session = await authSession();
  const isAdmin = session?.user?.role === "admin";

  // Base menu items for all users
  const baseItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Onboarding",
    url: "/onboarding",
    icon: User,
  },
    {
      title: "Deals",
      url: "/deals",
      icon: Briefcase,
    },
  ];

  // Admin-only items
  const adminItems = [
  {
    title: "Admin",
    url: "/admin",
    icon: Shield,
  },
  {
      title: "Admin Deals",
    url: "/admin/deals",
    icon: Briefcase,
  },
];

  // Combine items based on user role
  const items = isAdmin ? [...baseItems, ...adminItems] : baseItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
