import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  ChartBar,
  ChevronRight,
  Home,
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
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/session-types";
import type { OpenSectionsState } from "./dashboard-siderbar";

type NavItem = {
  title: string;
  url: string;
  icon: typeof Home;
};

const mainItems: NavItem[] = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: ChartBar },
  { title: "Onboarding", url: "/onboarding", icon: User },
  { title: "Deals", url: "/deals", icon: Briefcase },
];

const adminItems: NavItem[] = [
  { title: "Admin", url: "/admin", icon: Shield },
  { title: "Compliance", url: "/admin/compliance", icon: UserCheck },
  { title: "Admin Deals", url: "/admin/deals", icon: Briefcase },
];

function isNavItemActive(pathname: string, url: string) {
  if (url === "/") {
    return pathname === "/";
  }

  return pathname === url || pathname.startsWith(`${url}/`);
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
                <SidebarMenuItem key={item.title}>
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
  openSections,
  onSectionOpenChange,
}: {
  session: Session;
  openSections: OpenSectionsState;
  onSectionOpenChange: (sectionId: string, open: boolean) => void;
}) {
  const isAdmin = session?.user?.role === "admin";

  return (
    <>
      <NavGroup
        id="main"
        label="Main"
        items={mainItems}
        openSections={openSections}
        onSectionOpenChange={onSectionOpenChange}
      />
      {isAdmin ? (
        <NavGroup
          id="admin"
          label="Admin"
          items={adminItems}
          openSections={openSections}
          onSectionOpenChange={onSectionOpenChange}
        />
      ) : null}
    </>
  );
}
