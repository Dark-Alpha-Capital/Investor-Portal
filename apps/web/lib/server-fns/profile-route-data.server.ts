import { authSession } from "@/lib/auth-session-from-request";
import { getUserClearance } from "@/lib/permissions";
import { isAdminUser } from "@/lib/user-role-guards";
import { getUserById, getUserWithKycAndClearance } from "@repo/db/queries";

export type ProfilePageDataResult = Promise<
  | { tag: "redirect"; to: "/login" }
  | { tag: "not_found" }
  | { tag: "forbidden" }
  | {
      tag: "ok";
      profile: {
        id: string;
        name: string;
        email: string;
        image: string | null;
        role: string | null;
        isOnboardingCompleted: boolean;
        clearanceStatus: string | null;
        createdAt: Date;
      };
      isOwnProfile: boolean;
    }
>;

export async function runFetchProfilePageData(
  userId: string,
): ProfilePageDataResult {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }

  const rows = await getUserById(userId);
  const profileUser = rows?.[0];
  if (!profileUser) {
    return { tag: "not_found" };
  }

  const isOwnProfile = session.user.id === userId;
  const viewerIsAdmin = isAdminUser(session.user);

  if (!isOwnProfile && !viewerIsAdmin) {
    return { tag: "forbidden" };
  }

  const [kycData, clearance] = await Promise.all([
    getUserWithKycAndClearance(userId),
    getUserClearance(userId),
  ]);

  return {
    tag: "ok",
    profile: {
      id: profileUser.id,
      name: profileUser.name,
      email: profileUser.email,
      image: profileUser.image ?? null,
      role: profileUser.role ?? null,
      isOnboardingCompleted: kycData?.isOnboardingCompleted ?? false,
      clearanceStatus: clearance?.status ?? kycData?.clearanceStatus ?? null,
      createdAt: profileUser.createdAt,
    },
    isOwnProfile,
  };
}
