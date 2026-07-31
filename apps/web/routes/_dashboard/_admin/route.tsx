import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAdminContext, type AuthedSession } from "@/lib/auth/route-auth";

export const Route = createFileRoute("/_dashboard/_admin")({
  beforeLoad: async ({ context }: { context: { session: AuthedSession } }) => {
    requireAdminContext(context.session);
  },
  component: AdminSegmentLayout,
});

function AdminSegmentLayout() {
  return <Outlet />;
}
