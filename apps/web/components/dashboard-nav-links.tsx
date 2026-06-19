import {
  Home,
  Shield,
  User,
  Briefcase,
  UserCheck,
  ChartBar,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Session } from "@/lib/session-types";

export function DashboardNavLinks({ session }: { session: Session }) {
  const isAdmin = session?.user?.role === "admin";

  // Base menu items for all users
  const baseItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },

    {
      title: "Dashboard",
      url: "/dashboard",
      icon: ChartBar,
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

  const NavItem = ({
    item,
  }: {
    item: (typeof baseItems)[number] | (typeof adminItems)[number];
  }) => (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        className="group relative transition-colors duration-150 rounded-sm"
      >
        <a href={item.url}>
          <item.icon className="h-4 w-4" />
          <span className="font-medium">{item.title}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Main
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="space-y-0.5">
            {baseItems.map((item) => (
              <NavItem key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {isAdmin && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {adminItems.map((item) => (
                <NavItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
