import {
  Outlet,
  createFileRoute,
  redirect,
  useRouteContext,
} from "@tanstack/react-router";
import { DashboardSidebar } from "@/components/dashboard-siderbar";
import { DashboardProviders } from "@/components/dashboard-providers";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
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
    return { session: r.session };
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
  const { session } = useRouteContext({ from: "/(dashboard)" });

  return (
    <DashboardProviders>
      <DashboardSidebar session={session} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="text-muted-foreground" />
        </header>
        <main className="flex-1 transition-all duration-150 ease-out">
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster />
    </DashboardProviders>
  );
}
