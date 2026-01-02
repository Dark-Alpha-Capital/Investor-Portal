"use client";

import {
  Home,
  Shield,
  User,
  Briefcase,
  UserCheck,
  LifeBuoy,
  Ticket,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useClientSession } from "@/lib/get-client-session";

export function DashboardNavLinks() {
  const { data: session, isPending } = useClientSession();
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
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy,
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
      title: "Tickets",
      url: "/admin/tickets",
      icon: Ticket,
    },
    {
      title: "Admin Deals",
      url: "/admin/deals",
      icon: Briefcase,
    },
  ];

  // Combine items based on user role
  const items = isAdmin ? [...baseItems, ...adminItems] : baseItems;

  if (isPending) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Application</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {baseItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton disabled>
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
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
  );
}

