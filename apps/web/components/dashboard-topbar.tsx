import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "@/hooks/use-app-navigation";
import type { Session } from "@/lib/session-types";
import { getDashboardHomePath } from "./dashboard-nav-links";
import { UserNav } from "./user-nav";

function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function DashboardBreadcrumbs({ session }: { session: Session }) {
  const pathname = usePathname();
  const homePath = getDashboardHomePath(session);
  const homeLabel = homePath === "/admin" ? "Admin" : "Dashboard";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || pathname === homePath) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{homeLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={homePath}>{homeLabel}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;

          return (
            <span key={href} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={href}>{formatSegment(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function DashboardTopbar({ session }: { session: Session }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="text-muted-foreground md:hidden" />
      <div className="min-w-0 flex-1">
        <DashboardBreadcrumbs session={session} />
      </div>
      <UserNav session={session} />
    </header>
  );
}
