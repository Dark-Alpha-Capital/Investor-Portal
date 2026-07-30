import {
  Outlet,
  createFileRoute,
  redirect,
  useRouteContext,
} from "@tanstack/react-router";
import { DashboardSidebar } from "@/components/dashboard-siderbar";
import { DashboardProviders } from "@/components/dashboard-providers";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { fetchSessionForDashboardLayout } from "@/lib/server-fns/investor-route-data";
import { generateNoIndexMetadata } from "@/lib/seo";

const meta = generateNoIndexMetadata("Investor Dashboard | DarkAlpha Capital");

function metaTitle(): string {
  const t = meta.title;
  return typeof t === "string" ? t : (t?.default ?? "Dashboard");
}

export const Route = createFileRoute("/(dashboard)")({
  beforeLoad: async () => {
    const r = await fetchSessionForDashboardLayout();
    if (r.tag === "redirect") {
      throw redirect({ to: r.to });
    }
    return { session: r.session, isOnboardingCompleted: r.isOnboardingCompleted };
  },
  head: () => ({
    meta: [
      { title: metaTitle() },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardShell,
});

function DashboardShell() {
  const { session, isOnboardingCompleted } = useRouteContext({
    from: "/(dashboard)",
  });

  return (
    <DashboardProviders>
      <DashboardSidebar
        session={session}
        isOnboardingCompleted={isOnboardingCompleted}
      />
      <SidebarInset>
        <DashboardTopbar session={session} />
        <main className="flex-1 transition-all duration-150 ease-out">
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster />
    </DashboardProviders>
  );
}
