import { useCallback, useEffect, useRef, useState } from "react";
import { Building2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { DashboardNavLinks } from "./dashboard-nav-links";
import type { Session } from "@/lib/auth/session-types";

const OPEN_SECTIONS_KEY = "app-sidebar-open-sections";
const HOVER_COLLAPSE_DELAY_MS = 300;

export type OpenSectionsState = Record<string, boolean>;

function readOpenSections(): OpenSectionsState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = sessionStorage.getItem(OPEN_SECTIONS_KEY);
    return stored ? (JSON.parse(stored) as OpenSectionsState) : {};
  } catch {
    return {};
  }
}

export function DashboardSidebar({
  session,
  isOnboardingCompleted,
}: {
  session: Session;
  isOnboardingCompleted: boolean;
}) {
  const { isMobile, setOpen } = useSidebar();
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [openSections, setOpenSections] =
    useState<OpenSectionsState>(readOpenSections);

  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (isMobile) {
      return;
    }

    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }

    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) {
      return;
    }

    collapseTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, HOVER_COLLAPSE_DELAY_MS);
  };

  const handleSectionOpenChange = useCallback((sectionId: string, open: boolean) => {
    setOpenSections((previous) => {
      const next = { ...previous, [sectionId]: open };
      sessionStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <Sidebar
      collapsible="icon"
      className="z-20 group-data-[state=expanded]:z-30"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Investor Portal" size="lg">
              <Building2 className="size-4" />
              <span className="font-semibold tracking-tight">
                Investor Portal
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <DashboardNavLinks
          session={session}
          isOnboardingCompleted={isOnboardingCompleted}
          openSections={openSections}
          onSectionOpenChange={handleSectionOpenChange}
        />
      </SidebarContent>
    </Sidebar>
  );
}
