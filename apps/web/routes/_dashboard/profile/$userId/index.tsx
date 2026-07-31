import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { format } from "date-fns";
import { Pencil, Shield, User } from "lucide-react";
import { fetchProfilePageData } from "@/lib/server-fns/profile-route-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_dashboard/profile/$userId/")({
  loader: async ({ params }) => {
    const r = await fetchProfilePageData({ data: { userId: params.userId } });
    if (r.tag === "redirect") {
      throw redirect({ to: r.to });
    }
    if (r.tag === "not_found" || r.tag === "forbidden") {
      throw notFound();
    }
    return r;
  },
  component: UserProfilePage,
});

function UserProfilePage() {
  const { profile, isOwnProfile } = Route.useLoaderData();
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const showOnboardingActions =
    isOwnProfile &&
    profile.role !== "admin" &&
    !profile.email.endsWith("@darkalphacapital.com");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-muted-foreground">
          {isOwnProfile ? "Your account details" : "Investor profile"}
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <Avatar className="size-16">
            <AvatarImage
              src={
                profile.image ??
                `https://avatar.vercel.sh/${profile.email}`
              }
              alt={profile.name}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{profile.name}</CardTitle>
            <CardDescription className="truncate">{profile.email}</CardDescription>
          </div>
          {profile.role === "admin" ? (
            <Badge variant="secondary" className="gap-1">
              <Shield className="size-3" />
              Admin
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Member since
              </dt>
              <dd className="mt-1 text-sm">
                {format(new Date(profile.createdAt), "MMM d, yyyy")}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Onboarding
              </dt>
              <dd className="mt-1 text-sm">
                {profile.isOnboardingCompleted ? "Completed" : "Incomplete"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Clearance
              </dt>
              <dd className="mt-1 text-sm capitalize">
                {profile.clearanceStatus?.replaceAll("_", " ") ?? "Not set"}
              </dd>
            </div>
          </dl>

          {showOnboardingActions ? (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {!profile.isOnboardingCompleted ? (
                <Button asChild>
                  <Link to="/onboarding">
                    <User className="mr-2 size-4" />
                    Complete Onboarding
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="secondary">
                    <Link to="/onboarding">
                      <User className="mr-2 size-4" />
                      View Application
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/profile/edit-onboarding">
                      <Pencil className="mr-2 size-4" />
                      Edit Application
                    </Link>
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
