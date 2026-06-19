import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAdminContext, type AuthedSession } from "@/lib/route-auth";

export const Route = createFileRoute("/(dashboard)/(admin)")({
  beforeLoad: async ({ context }: { context: { session: AuthedSession } }) => {
    requireAdminContext(context.session);
  },
  component: AdminSegmentLayout,
});

function AdminSegmentLayout() {
  return <Outlet />;
}
