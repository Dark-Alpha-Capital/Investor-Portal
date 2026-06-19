import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(dashboard)/profile/$userId/")({
  component: UserProfilePage,
});

function UserProfilePage() {
  return <div>UserProfilePage</div>;
}
