import { authSession } from "@/lib/auth/session-from-request";
import {
  getUserOnboardingStatus,
  getOnboardingWithEditHistory,
  getUserWithOnboarding,
} from "@repo/db/queries";
import {
  getOnboardingRestrictedRedirectPath,
  isOnboardingAdminRestrictedUser,
} from "@/lib/auth/user-role-guards";
import {
  getUserClearance,
  type ClearanceStatus,
} from "@/lib/auth/permissions";

type AuthRedirect = { tag: "redirect"; to: "/login" | "/admin" | "/dashboard" };

export type OnboardingClearanceSummary = {
  status: ClearanceStatus;
  investorVisibleNotes: string | null;
  conditions: string[] | null;
  clearedAt: Date | null;
};

export type OnboardingPageDataResult = Promise<
  | AuthRedirect
  | { tag: "flow" }
  | {
      tag: "complete";
      onboarding: NonNullable<
        Awaited<ReturnType<typeof getOnboardingWithEditHistory>>
      >["onboarding"];
      editHistory: NonNullable<
        Awaited<ReturnType<typeof getOnboardingWithEditHistory>>
      >["editHistory"];
      clearance: OnboardingClearanceSummary;
    }
>;

export async function runFetchOnboardingPageData(): OnboardingPageDataResult {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }
  if (isOnboardingAdminRestrictedUser(session.user)) {
    return {
      tag: "redirect",
      to: getOnboardingRestrictedRedirectPath(session.user),
    };
  }

  const userId = session.user.id;
  const { isOnboardingCompleted } = await getUserOnboardingStatus(userId);

  if (!isOnboardingCompleted) {
    return { tag: "flow" };
  }

  const [data, clearance] = await Promise.all([
    getOnboardingWithEditHistory(userId),
    getUserClearance(userId),
  ]);
  if (!data) {
    return { tag: "flow" };
  }

  return {
    tag: "complete",
    onboarding: data.onboarding,
    editHistory: data.editHistory,
    clearance: {
      status: clearance?.status ?? "pending_review",
      investorVisibleNotes: clearance?.investorVisibleNotes ?? null,
      conditions: clearance?.conditionsJson ?? null,
      clearedAt: clearance?.clearedAt ?? null,
    },
  };
}

export type OnboardingEditPageDataResult = Promise<
  | AuthRedirect
  | { tag: "no_onboarding" }
  | { tag: "editing_disabled" }
  | {
      tag: "edit_flow";
      existingOnboarding: NonNullable<
        Awaited<ReturnType<typeof getUserWithOnboarding>>["onboarding"]
      >;
    }
>;

export async function runFetchOnboardingEditPageData(): OnboardingEditPageDataResult {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }
  if (isOnboardingAdminRestrictedUser(session.user)) {
    return {
      tag: "redirect",
      to: getOnboardingRestrictedRedirectPath(session.user),
    };
  }

  const userId = session.user.id;
  const data = await getUserWithOnboarding(userId);

  if (!data || !data.onboarding) {
    return { tag: "no_onboarding" };
  }

  // Investors cannot edit onboarding after submission
  if (
    data.onboarding.submittedAt != null ||
    data.onboarding.status === "submitted" ||
    data.onboarding.isEditable === false
  ) {
    return { tag: "editing_disabled" };
  }

  return { tag: "edit_flow", existingOnboarding: data.onboarding };
}

export type ProfileEditOnboardingDataResult = Promise<
  | AuthRedirect
  | { tag: "no_onboarding" }
  | {
      tag: "ok";
      onboarding: NonNullable<
        Awaited<ReturnType<typeof getOnboardingWithEditHistory>>
      >["onboarding"];
      editHistory: NonNullable<
        Awaited<ReturnType<typeof getOnboardingWithEditHistory>>
      >["editHistory"];
    }
>;

export async function runFetchProfileEditOnboardingData(): ProfileEditOnboardingDataResult {
  const session = await authSession();
  if (!session?.user) {
    return { tag: "redirect", to: "/login" };
  }
  if (isOnboardingAdminRestrictedUser(session.user)) {
    return {
      tag: "redirect",
      to: getOnboardingRestrictedRedirectPath(session.user),
    };
  }

  const userId = session.user.id;
  const data = await getOnboardingWithEditHistory(userId);

  if (!data || !data.onboarding) {
    return { tag: "no_onboarding" };
  }

  return {
    tag: "ok",
    onboarding: data.onboarding,
    editHistory: data.editHistory,
  };
}
