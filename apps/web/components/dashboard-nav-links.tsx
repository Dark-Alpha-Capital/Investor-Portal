import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  ChartBar,
  ChevronRight,
  FileText,
  MessageSquare,
  PieChart,
  Shield,
  User,
  UserCheck,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "@/hooks/use-app-navigation";
import {
  getAppHomePath,
  isAdminUser,
  isOnboardingAdminRestrictedUser,
} from "@/lib/auth/user-role-guards";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/auth/session-types";
import type { OpenSectionsState } from "./dashboard-siderbar";

type NavItem = {
  title: string;
  url: string;
  icon: typeof ChartBar;
};

const adminNavItems: NavItem[] = [
  { title: "Admin", url: "/admin", icon: Shield },
  { title: "Compliance", url: "/admin/compliance", icon: UserCheck },
  { title: "Deals", url: "/admin/deals", icon: Briefcase },
];

function isNavItemActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

function buildInvestorNavItems(isOnboardingCompleted: boolean): NavItem[] {
  const items: NavItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: ChartBar },
    {
      title: isOnboardingCompleted ? "My Application" : "Onboarding",
      url: "/onboarding",
      icon: isOnboardingCompleted ? FileText : User,
    },
    { title: "Deals", url: "/deals", icon: Briefcase },
    { title: "My Investments", url: "/investments", icon: PieChart },
    { title: "Chat", url: "/chat", icon: MessageSquare },
  ];

  return items;
}

function buildAdminNavItems(): NavItem[] {
  return [
    { title: "Admin", url: "/admin", icon: Shield },
    { title: "Compliance", url: "/admin/compliance", icon: UserCheck },
    { title: "Deals", url: "/admin/deals", icon: Briefcase },
    { title: "Chat", url: "/chat", icon: MessageSquare },
  ];
}

function NavGroup({
  id,
  label,
  items,
  openSections,
  onSectionOpenChange,
}: {
  id: string;
  label: string;
  items: NavItem[];
  openSections: OpenSectionsState;
  onSectionOpenChange: (sectionId: string, open: boolean) => void;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const persistedOpen = openSections[id] ?? false;
  const isOpen = isCollapsed ? true : persistedOpen;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(open) => {
        if (!isCollapsed) {
          onSectionOpenChange(id, open);
        }
      }}
    >
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer [&>svg]:size-4">
            {label}
            <ChevronRight
              className={cn(
                "ml-auto transition-transform duration-200",
                persistedOpen && !isCollapsed && "rotate-90"
              )}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {items.map((item) => (
                <SidebarMenuItem key={`${id}-${item.url}`}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isNavItemActive(pathname, item.url)}
                    className="group relative rounded-sm transition-colors duration-150"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function DashboardNavLinks({
  session,
  isOnboardingCompleted,
  openSections,
  onSectionOpenChange,
}: {
  session: Session;
  isOnboardingCompleted: boolean;
  openSections: OpenSectionsState;
  onSectionOpenChange: (sectionId: string, open: boolean) => void;
}) {
  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const isAdmin = isAdminUser(user);
  const onboardingRestricted = isOnboardingAdminRestrictedUser(user);

  if (isAdmin) {
    return (
      <NavGroup
        id="admin"
        label="Admin"
        items={buildAdminNavItems()}
        openSections={openSections}
        onSectionOpenChange={onSectionOpenChange}
      />
    );
  }

  const investorItems = buildInvestorNavItems(
    onboardingRestricted ? false : isOnboardingCompleted,
  ).filter((item) => {
    if (onboardingRestricted) {
      return item.url !== "/onboarding";
    }
    return true;
  });

  return (
    <NavGroup
      id="main"
      label="Main"
      items={investorItems}
      openSections={openSections}
      onSectionOpenChange={onSectionOpenChange}
    />
  );
}

export function getDashboardHomePath(session: Session): "/admin" | "/dashboard" {
  if (!session?.user) {
    return "/dashboard";
  }

  return getAppHomePath(session.user);
}

// Keep export for tests/consumers that referenced adminItems
export { adminNavItems };
