import { Home, Shield, User, Briefcase, UserCheck } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Session } from "@/app/(auth)/auth";

export function DashboardNavLinks({ session }: { session: Session }) {
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
      title: "Compliance",
      url: "/admin/compliance",
      icon: UserCheck,
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
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Navigation
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className="group relative transition-colors duration-150"
              >
                <a href={item.url}>
                  <item.icon className="h-4 w-4 transition-transform duration-150 group-hover:scale-110" />
                  <span className="font-medium">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
